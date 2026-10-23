const ROUTES = new Map([
  ["health", { method: "GET", upstream: "/healthz", auth: false }],
  ["company-summary", { method: "POST", upstream: "/webhook/company-summary", auth: true }],
  ["test/company-summary", { method: "POST", upstream: "/webhook-test/company-summary", auth: true }],
  ["customer-agent-chat", { method: "POST", upstream: "/webhook/customer-agent-chat", auth: true }],
  ["test/customer-agent-chat", { method: "POST", upstream: "/webhook-test/customer-agent-chat", auth: true }]
]);

export const MAX_BODY_BYTES = 100_000;
export const MAX_RESPONSE_BYTES = 2_000_000;
export const RATE_LIMIT_PER_MINUTE = 30;

export function normalizeProxyPath(rawPath) {
  const value = Array.isArray(rawPath) ? rawPath.join("/") : String(rawPath || "");
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return "";
  }
  const normalized = decoded.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.includes("..") || normalized.includes("//")) {
    return "";
  }
  return ROUTES.has(normalized) ? normalized : "";
}

export function getRoute(rawPath) {
  return ROUTES.get(normalizeProxyPath(rawPath)) || null;
}

export function sanitizeRequestBody(body) {
  let parsed = body;
  if (typeof body === "string") {
    try {
      parsed = JSON.parse(body);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const copy = { ...parsed };
  delete copy.shared_secret;
  delete copy["x-shared-secret"];

  let serialized;
  try {
    serialized = JSON.stringify(copy);
  } catch {
    return null;
  }
  if (Buffer.byteLength(serialized, "utf8") > MAX_BODY_BYTES) {
    return null;
  }
  return copy;
}

export function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== "object") return value;
  const copy = {};
  for (const [key, item] of Object.entries(value)) {
    if (/^(shared_secret|x-shared-secret|retellApiKey|retell_api_key|firecrawlApiKey|firecrawl_api_key|api_key|apiKey|authorization)$/i.test(key)) {
      continue;
    }
    copy[key] = redactSecrets(item);
  }
  return copy;
}

export function createRateLimiter({
  limit = RATE_LIMIT_PER_MINUTE,
  windowMs = 60_000,
  now = Date.now
} = {}) {
  const buckets = new Map();
  return {
    check(key) {
      const userId = String(key || "anonymous");
      const time = now();
      let bucket = buckets.get(userId);
      if (!bucket || time >= bucket.resetAt) {
        bucket = { count: 0, resetAt: time + windowMs };
        buckets.set(userId, bucket);
      }
      bucket.count += 1;
      if (buckets.size > 5_000) {
        for (const [id, item] of buckets) {
          if (time >= item.resetAt) buckets.delete(id);
        }
      }
      return bucket.count <= limit;
    }
  };
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function requestPath(req) {
  try {
    const url = new URL(req.url || "/", "https://internal.invalid");
    return url.pathname.replace(/^\/api\/n8n\/?/, "");
  } catch {
    return "";
  }
}

export function createProxyHandler({
  verifyToken,
  fetchImpl = globalThis.fetch,
  rateLimiter = createRateLimiter()
} = {}) {
  if (typeof verifyToken !== "function") {
    throw new Error("verifyToken is required");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is unavailable");
  }

  return async function handler(req, res) {
    const route = getRoute(requestPath(req));
    if (!route) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }

    if (req.method !== route.method) {
      res.setHeader("Allow", route.method);
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }

    const baseUrl = String(process.env.N8N_BASE_URL || "http://localhost:5678").replace(/\/+$/, "");

    if (!route.auth) {
      try {
        const upstream = await fetchImpl(`${baseUrl}${route.upstream}`, {
          method: "GET",
          signal: AbortSignal.timeout(5_000)
        });
        sendJson(res, upstream.ok ? 200 : 503, { ok: upstream.ok });
      } catch {
        sendJson(res, 503, { ok: false });
      }
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
      if (process.env.APP_ORIGIN) {
        options.authorizedParties = [process.env.APP_ORIGIN];
      }
      claims = await verifyToken(options);
    } catch {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    const userId = claims && claims.sub;
    if (!userId) {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    if (!rateLimiter.check(userId)) {
      sendJson(res, 429, { error: "rate_limited" });
      return;
    }

    const body = sanitizeRequestBody(req.body);
    if (!body) {
      sendJson(res, 400, { error: "invalid_body" });
      return;
    }

    const sharedSecret = process.env.N8N_SHARED_SECRET;
    if (!sharedSecret) {
      sendJson(res, 500, { error: "backend_not_configured" });
      return;
    }

    try {
      const upstream = await fetchImpl(`${baseUrl}${route.upstream}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-shared-secret": sharedSecret,
          "x-client-id": userId
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(190_000)
      });

      const text = await upstream.text();
      if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
        sendJson(res, 502, { error: "upstream_response_too_large" });
        return;
      }

      let safeText = text;
      try {
        safeText = JSON.stringify(redactSecrets(JSON.parse(text)));
      } catch {
        safeText = text;
      }
      if (sharedSecret) {
        safeText = safeText.split(sharedSecret).join("[REDACTED]");
      }

      res.statusCode = upstream.status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(safeText);
    } catch {
      sendJson(res, 502, { error: "upstream_unavailable" });
    }
  };
}
