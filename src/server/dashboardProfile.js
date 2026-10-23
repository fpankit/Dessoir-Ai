import { createRateLimiter } from "./n8nProxy.js";

export const MAX_BODY_BYTES = 12000;
export const MAX_WORKSPACE_BYTES = 7600;
export const MAX_AGENTS = 2;
export const METADATA_KEY = "dessoirDashboard";

export class ProfileError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function text(value, max, multiline = false) {
  const source = String(value == null ? "" : value).replace(/\u0000/g, "");
  const normalized = multiline
    ? source.replace(/\r\n/g, "\n").replace(/[^\S\n]+/g, " ").trim()
    : source.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const sliced = normalized.slice(0, max);
  if (multiline) return sliced.trim();
  const cut = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, cut > max * 0.6 ? cut : max).trim()}...`;
}

function list(value, maxItems, itemMax, pattern) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map((item) => text(item, itemMax))
    .filter((item) => item && (!pattern || pattern.test(item)))
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, maxItems);
}

function integer(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function iso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeUrl(value) {
  const raw = text(value, 300);
  if (!raw) return "";
  try {
    const parsed = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function domainFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function sanitizeCompany(raw, now) {
  const value = raw && typeof raw === "object" ? raw : {};
  const websiteUrl = safeUrl(value.website_url);
  return {
    company_name: text(value.company_name, 120),
    website_url: websiteUrl,
    domain: domainFromUrl(websiteUrl),
    one_liner: text(value.one_liner, 240),
    what_the_company_does: text(value.what_the_company_does, 1200),
    primary_target_audience: text(value.primary_target_audience, 300),
    key_products_or_services: list(value.key_products_or_services, 6, 120),
    industry: text(value.industry, 100),
    key_tags: list(value.key_tags, 8, 40),
    location_info: text(value.location_info, 400),
    pricing_info: text(value.pricing_info, 500),
    faq_info: text(value.faq_info, 700),
    website_context: text(value.website_context, 1800, true),
    page_title: text(value.page_title, 160),
    meta_description: text(value.meta_description, 300),
    confidence_score: integer(value.confidence_score, 0, 100, 0),
    pages_fetched: integer(value.pages_fetched, 0, 100000, 0),
    scraped_at: iso(value.scraped_at) || now
  };
}

function sanitizeAgent(raw, index, now) {
  const value = raw && typeof raw === "object" ? raw : {};
  const company = sanitizeCompany(value.company, now);
  const config = value.config && typeof value.config === "object" ? value.config : {};
  const id = /^[a-zA-Z0-9_-]{3,80}$/.test(String(value.id || ""))
    ? String(value.id)
    : `agent_${index + 1}`;
  const name = text(config.name, 120) || `${company.company_name || "Company"} Support`;
  if (!company.company_name && !text(config.name, 120)) return null;

  return {
    id,
    status: ["active", "paused", "draft"].includes(value.status) ? value.status : "active",
    createdAt: iso(value.createdAt) || now,
    updatedAt: now,
    company,
    config: {
      name,
      role: text(config.role, 100) || "Customer support",
      tone: text(config.tone, 60) || "Professional",
      language: text(config.language, 60) || "English",
      persona: text(config.persona, 1200, true),
      tools: list(config.tools, 8, 40, /^[a-zA-Z0-9_-]+$/),
      channels: list(config.channels, 6, 40, /^[a-zA-Z0-9_-]+$/)
    }
  };
}

export function sanitizeWorkspace(raw, now = new Date().toISOString()) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ProfileError(400, "invalid_workspace");
  }

  const agents = Array.isArray(raw.agents)
    ? raw.agents.map((agent, index) => sanitizeAgent(agent, index, now)).filter(Boolean).slice(0, MAX_AGENTS)
    : [];
  const activeAgentId = agents.some((agent) => agent.id === raw.activeAgentId)
    ? raw.activeAgentId
    : agents[0]?.id || "";
  const integrations = Array.isArray(raw.integrations)
    ? raw.integrations
        .map((item) => {
          const id = text(item?.id, 40);
          if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
          return {
            id,
            connected: Boolean(item?.connected),
            connectedAt: item?.connected ? iso(item?.connectedAt) || now : null
          };
        })
        .filter(Boolean)
        .slice(0, 24)
    : [];
  const automations = Array.isArray(raw.automations)
    ? raw.automations
        .map((item) => {
          const id = text(item?.id, 40);
          if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
          return { id, enabled: Boolean(item?.enabled) };
        })
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const usage = raw.usage && typeof raw.usage === "object" ? raw.usage : {};
  const activity = Array.isArray(raw.activity)
    ? raw.activity
        .map((item) => ({
          id: text(item?.id, 80) || `activity_${Date.now()}`,
          type: text(item?.type, 40) || "update",
          title: text(item?.title, 120),
          detail: text(item?.detail, 240),
          createdAt: iso(item?.createdAt) || now
        }))
        .filter((item) => item.title)
        .slice(0, 8)
    : [];

  const workspace = {
    version: 1,
    workspaceName: text(raw.workspaceName, 80) || "Dessoir Workspace",
    activeAgentId,
    agents,
    integrations,
    automations,
    usage: {
      creditsUsed: integer(usage.creditsUsed, 0, 1000000, 0),
      creditsLimit: integer(usage.creditsLimit, 1, 1000000, 10000),
      scrapes: integer(usage.scrapes, 0, 100000, 0),
      pagesIndexed: integer(usage.pagesIndexed, 0, 1000000, 0),
      conversations: integer(usage.conversations, 0, 1000000, 0),
      messages: integer(usage.messages, 0, 1000000, 0)
    },
    activity,
    updatedAt: now
  };

  const size = Buffer.byteLength(JSON.stringify(workspace), "utf8");
  if (size > MAX_WORKSPACE_BYTES) {
    throw new ProfileError(413, "workspace_too_large");
  }
  return workspace;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const declared = Number(req.headers?.["content-length"]);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new ProfileError(413, "request_too_large");
  }
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
      if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
        throw new ProfileError(413, "request_too_large");
      }
      try {
        return JSON.parse(raw);
      } catch {
        throw new ProfileError(400, "invalid_json");
      }
    }
    if (typeof req.body === "object") {
      let raw;
      try {
        raw = JSON.stringify(req.body);
      } catch {
        throw new ProfileError(400, "invalid_json");
      }
      if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
        throw new ProfileError(413, "request_too_large");
      }
      return req.body;
    }
    throw new ProfileError(400, "invalid_body");
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    total += value.length;
    if (total > MAX_BODY_BYTES) throw new ProfileError(413, "request_too_large");
    chunks.push(value);
  }
  if (!chunks.length) throw new ProfileError(400, "invalid_body");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ProfileError(400, "invalid_json");
  }
}

export function createDashboardHandler({
  verifyToken,
  createClerkClient,
  rateLimiter = createRateLimiter({ limit: 60 })
} = {}) {
  if (typeof verifyToken !== "function") throw new Error("verifyToken is required");
  if (typeof createClerkClient !== "function") {
    throw new Error("createClerkClient is required");
  }

  return async function handler(req, res) {
    const method = String(req.method || "GET").toUpperCase();
    if (method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Allow", "GET, POST, DELETE, OPTIONS");
      res.end();
      return;
    }
    if (!["GET", "POST", "DELETE"].includes(method)) {
      res.setHeader("Allow", "GET, POST, DELETE, OPTIONS");
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }

    const authHeader = String(req.headers?.authorization || "");
    if (!authHeader.startsWith("Bearer ")) {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      sendJson(res, 500, { error: "auth_not_configured" });
      return;
    }

    let claims;
    try {
      const options = {
        token: authHeader.slice(7).trim(),
        secretKey
      };
      if (process.env.APP_ORIGIN) options.authorizedParties = [process.env.APP_ORIGIN];
      claims = await verifyToken(options);
    } catch {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    const userId = claims?.sub;
    if (!userId) {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }
    if (!rateLimiter.check(userId)) {
      sendJson(res, 429, { error: "rate_limited" });
      return;
    }

    let clerk;
    try {
      clerk = createClerkClient({ secretKey });
    } catch {
      sendJson(res, 500, { error: "storage_unavailable" });
      return;
    }

    try {
      if (method === "GET") {
        const user = await clerk.users.getUser(userId);
        const workspace = user?.privateMetadata?.[METADATA_KEY];
        sendJson(res, 200, { workspace: workspace || null });
        return;
      }

      if (method === "DELETE") {
        const user = await clerk.users.getUser(userId);
        const privateMetadata = { ...(user?.privateMetadata || {}) };
        delete privateMetadata[METADATA_KEY];
        await clerk.users.replaceUserMetadata(userId, { privateMetadata });
        sendJson(res, 200, { ok: true });
        return;
      }

      const body = await readBody(req);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new ProfileError(400, "invalid_body");
      }
      const workspace = sanitizeWorkspace(body.workspace);
      await clerk.users.updateUserMetadata(userId, {
        privateMetadata: { [METADATA_KEY]: workspace }
      });
      sendJson(res, 200, { workspace });
    } catch (error) {
      if (error instanceof ProfileError) {
        sendJson(res, error.status, { error: error.code });
        return;
      }
      sendJson(res, 500, { error: "storage_unavailable" });
    }
  };
}
