import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_BODY_BYTES,
  ProfileError,
  createDashboardHandler,
  sanitizeWorkspace
} from "../src/server/dashboardProfile.js";

function makeRes() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    end(chunk) {
      if (chunk) this.body += String(chunk);
    }
  };
}

function makeReq({ method = "GET", body, headers = {} } = {}) {
  return { method, body, headers };
}

function parse(res) {
  return JSON.parse(res.body || "{}");
}

function createClient({ privateMetadata = {} } = {}) {
  const calls = {
    update: null,
    replace: null
  };
  return {
    calls,
    users: {
      async getUser() {
        return { privateMetadata };
      },
      async updateUserMetadata(userId, params) {
        calls.update = { userId, params };
        return { id: userId };
      },
      async replaceUserMetadata(userId, params) {
        calls.replace = { userId, params };
        return { id: userId };
      }
    }
  };
}

function workspaceFixture(overrides = {}) {
  return {
    workspaceName: "Acme workspace",
    activeAgentId: "agent_1",
    agents: [
      {
        id: "agent_1",
        status: "active",
        company: {
          company_name: "Acme",
          website_url: "https://acme.com",
          website_context: "Acme builds tools."
        },
        config: {
          name: "Acme Support",
          role: "Customer support",
          persona: "Be helpful.",
          tools: ["knowledge-base"],
          channels: ["website"]
        }
      }
    ],
    integrations: [{ id: "slack", connected: true }],
    automations: [{ id: "knowledge-refresh", enabled: true }],
    usage: { creditsUsed: 2, creditsLimit: 10000 },
    activity: [{ id: "a1", type: "research", title: "Company researched", createdAt: new Date().toISOString() }],
    ...overrides
  };
}

test("sanitizeWorkspace normalizes workspace state and derives the domain", () => {
  const workspace = sanitizeWorkspace(workspaceFixture(), "2026-01-01T00:00:00.000Z");
  assert.equal(workspace.workspaceName, "Acme workspace");
  assert.equal(workspace.activeAgentId, "agent_1");
  assert.equal(workspace.agents[0].company.domain, "acme.com");
  assert.deepEqual(workspace.agents[0].config.channels, ["website"]);
  assert.equal(workspace.integrations[0].connected, true);
  assert.equal(workspace.updatedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(workspace.agents[0].updatedAt, "2026-01-01T00:00:00.000Z");
});

test("sanitizeWorkspace rejects unsafe URLs and caps agent count", () => {
  const workspace = sanitizeWorkspace(
    workspaceFixture({
      activeAgentId: "missing",
      agents: [
        workspaceFixture().agents[0],
        { ...workspaceFixture().agents[0], id: "agent_2" },
        { ...workspaceFixture().agents[0], id: "agent_3" }
      ]
    })
  );
  assert.equal(workspace.agents.length, 2);
  assert.equal(workspace.activeAgentId, "agent_1");
  assert.equal(workspace.agents[0].company.website_url, "https://acme.com/");

  const unsafe = sanitizeWorkspace(
    workspaceFixture({
      agents: [
        {
          ...workspaceFixture().agents[0],
          company: { company_name: "Unsafe", website_url: "javascript:alert(1)" }
        }
      ]
    })
  );
  assert.equal(unsafe.agents[0].company.website_url, "");
  assert.equal(unsafe.agents[0].company.domain, "");
});

test("sanitizeWorkspace rejects workspaces over the metadata budget", () => {
  const large = workspaceFixture({
    agents: [0, 1].map((index) => ({
      id: `agent_${index + 1}`,
      status: "active",
      company: {
        company_name: `Company ${index + 1}`,
        website_url: `https://company${index + 1}.com`,
        what_the_company_does: "x".repeat(1200),
        primary_target_audience: "y".repeat(300),
        key_products_or_services: Array.from({ length: 6 }, (_, item) => `Product ${item} ${"z".repeat(100)}`),
        key_tags: Array.from({ length: 8 }, (_, item) => `tag-${item}-${"t".repeat(30)}`),
        location_info: "l".repeat(400),
        pricing_info: "p".repeat(500),
        faq_info: "f".repeat(700),
        website_context: "c".repeat(1800)
      },
      config: {
        name: `Agent ${index + 1}`,
        persona: "i".repeat(1200),
        channels: ["website"],
        tools: ["knowledge-base"]
      }
    }))
  });
  assert.throws(
    () => sanitizeWorkspace(large),
    (error) => error instanceof ProfileError && error.status === 413
  );
});

test("dashboard API rejects missing or invalid authorization", async () => {
  const handler = createDashboardHandler({
    verifyToken: async ({ token }) => {
      if (token !== "good") throw new Error("invalid");
      return { sub: "user_1" };
    },
    createClerkClient: () => createClient(),
    rateLimiter: { check: () => true }
  });
  const original = process.env.CLERK_SECRET_KEY;
  process.env.CLERK_SECRET_KEY = "sk_test_secret";

  try {
    const missing = makeRes();
    await handler(makeReq(), missing);
    assert.equal(missing.statusCode, 401);

    const invalid = makeRes();
    await handler(makeReq({ headers: { authorization: "Bearer bad" } }), invalid);
    assert.equal(invalid.statusCode, 401);
  } finally {
    if (original === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = original;
  }
});

test("dashboard API loads and saves workspace metadata", async () => {
  const original = process.env.CLERK_SECRET_KEY;
  process.env.CLERK_SECRET_KEY = "sk_test_secret";
  const client = createClient();
  const handler = createDashboardHandler({
    verifyToken: async ({ token }) => {
      if (token !== "good") throw new Error("invalid");
      return { sub: "user_1" };
    },
    createClerkClient: () => client,
    rateLimiter: { check: () => true }
  });

  try {
    const loaded = makeRes();
    await handler(
      makeReq({ headers: { authorization: "Bearer good" } }),
      loaded
    );
    assert.equal(loaded.statusCode, 200);
    assert.equal(parse(loaded).workspace, null);

    const saved = makeRes();
    await handler(
      makeReq({
        method: "POST",
        headers: { authorization: "Bearer good" },
        body: { workspace: workspaceFixture({ extra: "discard me" }) }
      }),
      saved
    );
    assert.equal(saved.statusCode, 200);
    const payload = parse(saved).workspace;
    assert.equal(payload.workspaceName, "Acme workspace");
    assert.equal(payload.extra, undefined);
    assert.equal(client.calls.update.userId, "user_1");
    assert.equal(
      client.calls.update.params.privateMetadata.dessoirDashboard.agents[0].company.company_name,
      "Acme"
    );
    assert.equal(
      client.calls.update.params.privateMetadata.dessoirDashboard.agents[0].company.website_url,
      "https://acme.com/"
    );
  } finally {
    if (original === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = original;
  }
});

test("dashboard API limits request size and supports deletion", async () => {
  const original = process.env.CLERK_SECRET_KEY;
  process.env.CLERK_SECRET_KEY = "sk_test_secret";
  const client = createClient({ privateMetadata: { other: true, dessoirDashboard: { version: 1 } } });
  const handler = createDashboardHandler({
    verifyToken: async () => ({ sub: "user_1" }),
    createClerkClient: () => client,
    rateLimiter: { check: () => true }
  });

  try {
    const oversized = makeRes();
    await handler(
      makeReq({
        method: "POST",
        headers: {
          authorization: "Bearer good",
          "content-length": String(MAX_BODY_BYTES + 1)
        },
        body: { workspace: workspaceFixture() }
      }),
      oversized
    );
    assert.equal(oversized.statusCode, 413);

    const deleted = makeRes();
    await handler(
      makeReq({ method: "DELETE", headers: { authorization: "Bearer good" } }),
      deleted
    );
    assert.equal(deleted.statusCode, 200);
    assert.equal(client.calls.replace.userId, "user_1");
    assert.equal(client.calls.replace.params.privateMetadata.dessoirDashboard, undefined);
    assert.equal(client.calls.replace.params.privateMetadata.other, true);
  } finally {
    if (original === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = original;
  }
});
