import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import vm from "node:vm";
import { afterEach, test } from "node:test";

import {
  MAX_BODY_BYTES,
  createProxyHandler,
  createRateLimiter,
  getRoute,
  normalizeProxyPath,
  redactSecrets,
  sanitizeRequestBody
} from "../src/server/n8nProxy.js";
import { normalizeBrief, normalizeUrl } from "../src/data/sampleBriefs.js";

const root = resolve(process.cwd());
const envKeys = ["CLERK_SECRET_KEY", "N8N_BASE_URL", "N8N_SHARED_SECRET", "APP_ORIGIN"];
const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

function setEnv(values) {
  for (const key of envKeys) {
    if (Object.prototype.hasOwnProperty.call(values, key)) process.env[key] = values[key];
    else delete process.env[key];
  }
}

function loadWorkflow() {
  return JSON.parse(readFileSync(join(root, "workflow.json"), "utf8"));
}

function codeNode(name) {
  const node = loadWorkflow().nodes.find((item) => item.name === name);
  assert.ok(node, `missing workflow node: ${name}`);
  return node.parameters.jsCode || "";
}

async function runCodeNode(name, {
  json = {},
  env = {},
  store = {},
  inputAll = [],
  thisArg = {},
  onStatic = () => {}
} = {}) {
  const context = vm.createContext({
    $json: json,
    $env: env,
    $input: { all: () => inputAll },
    $getWorkflowStaticData: () => {
      onStatic();
      return store;
    },
    $: () => ({ first: () => ({ json: {} }) }),
    console,
    URL,
    URLSearchParams,
    Date,
    Math,
    JSON,
    Set,
    Map,
    WeakMap,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Promise,
    Error,
    TypeError,
    setTimeout,
    clearTimeout,
    helpers: thisArg.helpers,
    __thisArg: thisArg
  });
  const wrapped = `(async function () {\n${codeNode(name)}\n}).call(__thisArg)`;
  return vm.runInContext(wrapped, context, { timeout: 10_000 });
}

function mockResponse() {
  const state = { statusCode: 200, headers: {}, body: "" };
  return {
    state,
    get statusCode() {
      return state.statusCode;
    },
    set statusCode(value) {
      state.statusCode = value;
    },
    setHeader(key, value) {
      state.headers[String(key).toLowerCase()] = value;
    },
    end(value) {
      state.body = String(value == null ? "" : value);
    }
  };
}

function mockRequest({ method = "POST", path = "/api/n8n/company-summary", headers = {}, body = {} } = {}) {
  return { method, url: path, headers, body };
}

test("security headers are present in vercel.json", () => {
  const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  const headers = Object.fromEntries(config.headers[0].headers.map((item) => [item.key, item.value]));
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Content-Security-Policy"], /worker-src[^;]*blob:/);
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.match(headers["Strict-Transport-Security"], /max-age=63072000/);
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
  for (const file of [
    "api/n8n/health.js",
    "api/n8n/company-summary.js",
    "api/n8n/customer-agent-chat.js",
    "api/n8n/test/company-summary.js",
    "api/n8n/test/customer-agent-chat.js"
  ]) {
    assert.equal(config.functions[file].maxDuration, 60);
  }
});

test("all HTML entry points keep the hardened meta CSP", () => {
  for (const file of ["index.html", "auth.html", "pricing.html", "dashboard.html"]) {
    const html = readFileSync(join(root, file), "utf8");
    const match = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
    assert.ok(match, `${file} is missing CSP`);
    const policy = match[1];
    assert.match(policy, /worker-src[^;]*blob:/);
    assert.match(policy, /googletagmanager/);
    assert.match(policy, /challenges\.cloudflare\.com/);
    assert.ok(!policy.includes("http://localhost:5678"), `${file} still allows direct n8n calls`);
  }
});

test("client code never contains the n8n shared secret", () => {
  const scraperApi = readFileSync(join(root, "src/services/scraperApi.js"), "utf8");
  const chatApi = readFileSync(join(root, "src/services/chatApi.js"), "utf8");
  const dashboardApp = readFileSync(join(root, "src/dashboard/DashboardApp.jsx"), "utf8");
  const clerkRoot = readFileSync(join(root, "src/ClerkRoot.jsx"), "utf8");
  assert.ok(!scraperApi.includes("VITE_N8N_SHARED_SECRET"));
  assert.ok(!chatApi.includes("N8N_SHARED_SECRET"));
  assert.ok(!scraperApi.includes("shared_secret:"));
  assert.match(scraperApi, /API_BASE = "\/api\/n8n"/);
  assert.match(dashboardApp, /isSignedIn/);
  assert.match(dashboardApp, /window\.location\.replace\("\/auth\.html\?mode=signin"\)/);
  assert.match(clerkRoot, /AuthTokenBridge/);
  assert.match(clerkRoot, /setAuthTokenProvider/);
});

test("Firestore rules deny by default and isolate user documents", () => {
  const rules = readFileSync(join(root, "firestore.rules"), "utf8");
  const firebase = JSON.parse(readFileSync(join(root, "firebase.json"), "utf8"));
  assert.equal(firebase.firestore.rules, "firestore.rules");
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false;/);
  assert.match(rules, /match \/users\/\{userId\}/);
  assert.match(rules, /request\.auth\.uid == userId/);
  assert.match(rules, /allow delete: if false;/);
});

test("proxy path normalization only allows known webhook routes", () => {
  assert.equal(normalizeProxyPath("company-summary"), "company-summary");
  assert.equal(normalizeProxyPath("test/company-summary"), "test/company-summary");
  assert.equal(getRoute("company-summary").upstream, "/webhook/company-summary");
  assert.equal(getRoute("test/company-summary").upstream, "/webhook-test/company-summary");
  assert.equal(getRoute("customer-agent-chat").upstream, "/webhook/customer-agent-chat");
  assert.equal(getRoute("test/customer-agent-chat").upstream, "/webhook-test/customer-agent-chat");
  assert.equal(getRoute("health").method, "GET");
  assert.equal(normalizeProxyPath("../company-summary"), "");
  assert.equal(normalizeProxyPath("%2e%2e/company-summary"), "");
  assert.equal(normalizeProxyPath("company-summary/../health"), "");
  assert.equal(normalizeProxyPath("unknown"), "");
  assert.equal(getRoute("unknown"), null);
});

test("request bodies strip secrets and enforce a size limit", () => {
  const sanitized = sanitizeRequestBody({
    url: "https://example.com",
    shared_secret: "must-not-forward",
    "x-shared-secret": "must-not-forward"
  });
  assert.deepEqual(sanitized, { url: "https://example.com" });
  assert.equal(sanitizeRequestBody("[]"), null);
  assert.equal(sanitizeRequestBody("{bad json"), null);
  assert.equal(sanitizeRequestBody({ message: "x".repeat(MAX_BODY_BYTES + 1) }), null);
});

test("proxy response redaction removes backend API keys", () => {
  const redacted = redactSecrets({
    ok: true,
    retellApiKey: "retell-secret",
    retell_api_key: "retell-snake-secret",
    firecrawlApiKey: "firecrawl-secret",
    firecrawl_api_key: "firecrawl-snake-secret",
    nested: { apiKey: "nested-secret", keep: "value" },
    retell_ai: { agent_id: "agent_1" }
  });
  assert.deepEqual(redacted, {
    ok: true,
    nested: { keep: "value" },
    retell_ai: { agent_id: "agent_1" }
  });
});

test("proxy requires a valid Clerk token before forwarding", async () => {
  setEnv({
    CLERK_SECRET_KEY: "sk_test_server",
    N8N_BASE_URL: "http://n8n.test",
    N8N_SHARED_SECRET: "server-secret",
    APP_ORIGIN: "https://app.test"
  });

  let verifyCalls = 0;
  let fetchCalls = 0;
  const handler = createProxyHandler({
    verifyToken: async () => {
      verifyCalls += 1;
      return { sub: "user_1" };
    },
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    }
  });

  const missing = mockResponse();
  await handler(mockRequest({ headers: {} }), missing);
  assert.equal(missing.state.statusCode, 401);
  assert.equal(verifyCalls, 0);
  assert.equal(fetchCalls, 0);

  const invalid = createProxyHandler({
    verifyToken: async () => {
      throw new Error("invalid token");
    },
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    }
  });
  const invalidRes = mockResponse();
  await invalid(
    mockRequest({ headers: { authorization: "Bearer bad-token" }, body: { url: "https://example.com" } }),
    invalidRes
  );
  assert.equal(invalidRes.state.statusCode, 401);
  assert.equal(fetchCalls, 0);
});

test("proxy verifies the token and injects the server-side secret", async () => {
  setEnv({
    CLERK_SECRET_KEY: "sk_test_server",
    N8N_BASE_URL: "http://n8n.test",
    N8N_SHARED_SECRET: "server-secret",
    APP_ORIGIN: "https://app.test"
  });

  let verifyOptions = null;
  let upstream = null;
  const handler = createProxyHandler({
    verifyToken: async (options) => {
      verifyOptions = options;
      return { sub: "user_1" };
    },
    fetchImpl: async (url, options) => {
      upstream = { url, options };
      return new Response(
        JSON.stringify({
          ok: true,
          retellApiKey: "backend-secret",
          nested: { shared_secret: "server-secret" }
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    }
  });

  const res = mockResponse();
  await handler(
    mockRequest({
      headers: { authorization: "Bearer token_1" },
      body: { url: "https://example.com", shared_secret: "client-value" }
    }),
    res
  );

  assert.equal(res.state.statusCode, 200);
  assert.equal(verifyOptions.token, "token_1");
  assert.equal(verifyOptions.secretKey, "sk_test_server");
  assert.deepEqual(verifyOptions.authorizedParties, ["https://app.test"]);
  assert.equal(upstream.url, "http://n8n.test/webhook/company-summary");
  assert.equal(upstream.options.headers["x-shared-secret"], "server-secret");
  assert.equal(upstream.options.headers["x-client-id"], "user_1");
  assert.deepEqual(JSON.parse(upstream.options.body), { url: "https://example.com" });
  assert.equal(res.state.headers["cache-control"], "no-store");
  assert.equal(res.state.body.includes("backend-secret"), false);
  assert.equal(res.state.body.includes("server-secret"), false);
});

test("proxy rate limits per authenticated user and fails closed without config", async () => {
  setEnv({
    CLERK_SECRET_KEY: "sk_test_server",
    N8N_BASE_URL: "http://n8n.test",
    N8N_SHARED_SECRET: "server-secret"
  });

  let fetchCalls = 0;
  const handler = createProxyHandler({
    verifyToken: async () => ({ sub: "user_1" }),
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    },
    rateLimiter: createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 1_000 })
  });

  const first = mockResponse();
  await handler(
    mockRequest({ headers: { authorization: "Bearer token" }, body: { url: "https://example.com" } }),
    first
  );
  assert.equal(first.state.statusCode, 200);

  const second = mockResponse();
  await handler(
    mockRequest({ headers: { authorization: "Bearer token" }, body: { url: "https://example.com" } }),
    second
  );
  assert.equal(second.state.statusCode, 429);
  assert.equal(fetchCalls, 1);

  delete process.env.N8N_SHARED_SECRET;
  const unconfiguredHandler = createProxyHandler({
    verifyToken: async () => ({ sub: "user_2" }),
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    },
    rateLimiter: createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 1_000 })
  });
  const unconfigured = mockResponse();
  await unconfiguredHandler(
    mockRequest({ headers: { authorization: "Bearer token" }, body: { url: "https://example.com" } }),
    unconfigured
  );
  assert.equal(unconfigured.state.statusCode, 500);
  assert.equal(fetchCalls, 1);
});

test("proxy supports health, rejects unknown routes, wrong methods, and bad bodies", async () => {
  setEnv({
    CLERK_SECRET_KEY: "sk_test_server",
    N8N_BASE_URL: "http://n8n.test",
    N8N_SHARED_SECRET: "server-secret"
  });

  const handler = createProxyHandler({
    verifyToken: async () => ({ sub: "user_1" }),
    fetchImpl: async (url, options) => {
      assert.equal(options.method, "GET");
      assert.equal(url, "http://n8n.test/healthz");
      return new Response("{}", { status: 200 });
    }
  });

  const health = mockResponse();
  await handler(mockRequest({ method: "GET", path: "/api/n8n/health", headers: {} }), health);
  assert.equal(health.state.statusCode, 200);
  assert.deepEqual(JSON.parse(health.state.body), { ok: true });

  const missing = mockResponse();
  await handler(mockRequest({ path: "/api/n8n/unknown" }), missing);
  assert.equal(missing.state.statusCode, 404);

  const method = mockResponse();
  await handler(mockRequest({ method: "GET" }), method);
  assert.equal(method.state.statusCode, 405);
  assert.equal(method.state.headers.allow, "POST");

  const body = mockResponse();
  await handler(
    mockRequest({ headers: { authorization: "Bearer token" }, body: "[]" }),
    body
  );
  assert.equal(body.state.statusCode, 400);
});

test("workflow extracts and validates URLs after authenticating", async () => {
  const secret = "test-secret";
  const env = { N8N_SHARED_SECRET: secret };
  let staticCalls = 0;
  const store = {};

  const unauthenticated = await runCodeNode("Extract & Validate URL", {
    json: { headers: { "x-client-id": "user_1" }, body: { url: "https://example.com" } },
    env,
    store,
    onStatic: () => {
      staticCalls += 1;
    }
  });
  assert.equal(unauthenticated[0].json.statusCode, 401);
  assert.equal(staticCalls, 0);

  const valid = await runCodeNode("Extract & Validate URL", {
    json: {
      headers: { "x-shared-secret": secret, "x-client-id": "user_1" },
      body: { url: "https://example.com" }
    },
    env,
    store
  });
  assert.equal(valid.length, 9);
  assert.ok(valid.every((item) => item.json.valid));
  assert.ok(valid.every((item) => item.json.url.startsWith("https://example.com")));

  const blocked = [
    "http://169.254.169.254/latest/meta-data/",
    "http://metadata.google.internal/",
    "http://127.0.0.1.nip.io/",
    "http://localtest.me/",
    "http://[::ffff:192.168.0.1]/",
    "ftp://example.com/"
  ];
  for (const url of blocked) {
    const result = await runCodeNode("Extract & Validate URL", {
      json: {
        headers: { "x-shared-secret": secret, "x-client-id": "user_2" },
        body: { url }
      },
      env,
      store
    });
    assert.equal(result[0].json.valid, false, url);
    assert.equal(result[0].json.statusCode, 422, url);
  }
});

test("workflow rate limits authenticated scrape requests", async () => {
  const secret = "test-secret";
  const env = { N8N_SHARED_SECRET: secret };
  const store = {};
  const results = [];
  for (let index = 0; index < 11; index += 1) {
    results.push(
      await runCodeNode("Extract & Validate URL", {
        json: {
          headers: { "x-shared-secret": secret, "x-client-id": "same-user" },
          body: { url: "https://example.com" }
        },
        env,
        store
      })
    );
  }
  assert.equal(results[9][0].json.valid, true);
  assert.equal(results[10][0].json.statusCode, 429);
});

test("workflow fetches reject blocked targets and revalidate redirects", async () => {
  let calls = 0;
  const blocked = await runCodeNode("Fetch Website HTML", {
    inputAll: [{ json: { url: "http://169.254.169.254/", pageType: "home" } }],
    thisArg: {
      helpers: {
        httpRequest: async () => {
          calls += 1;
          return { statusCode: 200, body: "should not run", headers: {} };
        }
      }
    }
  });
  assert.equal(calls, 0);
  assert.match(blocked[0].json.error, /Blocked/);

  let redirectCalls = 0;
  const redirect = await runCodeNode("Fetch Website HTML", {
    inputAll: [{ json: { url: "https://example.com/", pageType: "home" } }],
    thisArg: {
      helpers: {
        httpRequest: async ({ url }) => {
          redirectCalls += 1;
          assert.equal(url, "https://example.com/");
          return {
            statusCode: 302,
            body: "",
            headers: { location: "http://127.0.0.1/" }
          };
        }
      }
    }
  });
  assert.equal(redirectCalls, 1);
  assert.match(redirect[0].json.error, /Blocked redirect/);

  const allowed = await runCodeNode("Fetch Website HTML", {
    inputAll: [{ json: { url: "https://example.com/", pageType: "home" } }],
    thisArg: {
      helpers: {
        httpRequest: async () => ({
          statusCode: 200,
          body: "<html>ok</html>",
          headers: {}
        })
      }
    }
  });
  assert.equal(allowed[0].json.source, "http");
  assert.equal(allowed[0].json.statusCode, 200);
});

test("chat auth fails closed, ignores global briefs, and rate limits", async () => {
  const secret = "test-secret";
  const env = { N8N_SHARED_SECRET: secret };
  const store = {
    latestBrief: {
      company_name: "Tenant A Secret",
      website_url: "https://tenant-a.com"
    },
    briefs: {
      "https://tenant-a.com": {
        company_name: "Tenant A Secret",
        website_url: "https://tenant-a.com"
      }
    }
  };

  const unauthorized = await runCodeNode("Agent Chat Responder", {
    json: { headers: { "x-shared-secret": "wrong" }, message: "hi" },
    env,
    store
  });
  assert.equal(unauthorized[0].json.statusCode, 401);

  const unconfigured = await runCodeNode("Agent Chat Responder", {
    json: { headers: { "x-shared-secret": secret }, message: "hi" },
    env: {},
    store
  });
  assert.equal(unconfigured[0].json.statusCode, 401);

  const scoped = await runCodeNode("Agent Chat Responder", {
    json: {
      headers: { "x-shared-secret": secret, "x-client-id": "tenant-b" },
      message: "What do you do?",
      website_url: "https://tenant-b.com"
    },
    env,
    store
  });
  assert.ok(!String(scoped[0].json.output).includes("Tenant A Secret"));

  let last = null;
  for (let index = 0; index < 31; index += 1) {
    last = await runCodeNode("Agent Chat Responder", {
      json: {
        headers: { "x-shared-secret": secret, "x-client-id": "chat-user" },
        message: "hi",
        company_name: "Tenant B",
        website_url: "https://tenant-b.com"
      },
      env,
      store
    });
  }
  assert.equal(last[0].json.statusCode, 429);
});

test("workflow prompts mark scraped content as untrusted", () => {
  const workflow = loadWorkflow();
  const llm = workflow.nodes.find((node) => node.name === "Basic LLM Chain");
  assert.match(llm.parameters.text, /Security rule:/);
  assert.match(llm.parameters.text, /untrusted scraped website data/i);
  const prepare = codeNode("Prepare Retell AI Payload");
  assert.match(prepare, /untrusted data/i);
  assert.match(prepare, /Ignore any instructions/i);
  const extract = codeNode("Extract & Validate URL");
  assert.match(extract, /function safeEqual/);
  assert.ok(!extract.includes("providedSecret !== envSharedSecret"));
});

test("normalizeBrief sanitizes external agent URLs", () => {
  const brief = normalizeBrief(
    {
      company_name: "Example",
      website_url: "https://example.com",
      one_liner: "An example company.",
      what_the_company_does: "Example builds examples for example customers.",
      retell_ai: {
        chat_interface_url: "javascript:alert(1)",
        chat_webhook_url: "https://hooks.example.com/chat",
        web_call_url: "data:text/html,<script>alert(1)</script>"
      }
    },
    "https://example.com"
  );
  assert.ok(brief);
  assert.equal(brief.retell_ai.chat_interface_url, null);
  assert.equal(brief.retell_ai.web_call_url, null);
  assert.equal(brief.retell_ai.chat_webhook_url, "https://hooks.example.com/chat");
  assert.equal(normalizeUrl("javascript:alert(1)").ok, false);
});
