import { normalizeBrief } from "../data/sampleBriefs";

export const N8N_BASE_URL = "http://localhost:5678";
export const N8N_PROD_WEBHOOK = `${N8N_BASE_URL}/webhook/company-summary`;
export const N8N_TEST_WEBHOOK = `${N8N_BASE_URL}/webhook-test/company-summary`;
export const WORKFLOW_ID = "Ggk1Ybv2PwGRpwwN";
export const WORKFLOW_URL = `${N8N_BASE_URL}/workflow/${WORKFLOW_ID}?projectId=8RvnxgYD82P4zfqz`;
// Increased timeout for local LLMs (Ollama) on CPU/GPU
export const REQUEST_TIMEOUT_MS = 180000;

// Shared secret verified inside the n8n workflow (value lives in .env.local
// as VITE_N8N_SHARED_SECRET and mirrors N8N_SHARED_SECRET on the n8n host).
export const N8N_SHARED_SECRET =
  import.meta.env.VITE_N8N_SHARED_SECRET || "";

export async function pingN8nStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    await fetch(`${N8N_BASE_URL}/healthz`, {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeScrapeRequest(targetUrl) {
  const attempts = [];
  const endpoints = [
    { label: "Production Webhook", endpoint: N8N_PROD_WEBHOOK },
    { label: "Test Webhook", endpoint: N8N_TEST_WEBHOOK }
  ];

  for (const item of endpoints) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(item.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          shared_secret: N8N_SHARED_SECRET
        }),
        signal: controller.signal
      });

      const text = await response.text();
      let payload = null;

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = null;
        }
      }

      const attempt = {
        label: item.label,
        endpoint: item.endpoint,
        status: response.status
      };
      const payloadDetail =
        payload && typeof payload === "object"
          ? String(payload.detail || payload.message || payload.error || "").trim()
          : "";
      if (payloadDetail && payloadDetail !== "SCRAPE_FAILED") {
        attempt.detail = payloadDetail;
      }

      if (response.ok) {
        const brief = normalizeBrief(payload, targetUrl);
        if (brief) {
          return { ok: true, brief, endpoint: item.endpoint, attempts };
        }
        attempt.body = text ? text.slice(0, 700) : "Empty response.";
        attempts.push(attempt);
      } else {
        attempt.body = text ? text.slice(0, 700) : "No error body.";
        attempts.push(attempt);
      }
    } catch (error) {
      attempts.push({
        label: item.label,
        endpoint: item.endpoint,
        error: error.name === "AbortError" ? `Timed out after ${REQUEST_TIMEOUT_MS / 1000}s` : error.message
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  const statuses = attempts.map((a) => a.status).filter(Boolean);
  const workflowDetail = attempts.map((a) => a.detail).filter(Boolean).pop();
  let kind = "offline";

  if (statuses.length) {
    kind = statuses.every((s) => s === 404 || s === 405) ? "inactive" : "http";
  }

  if (statuses.some((s) => s >= 200 && s < 300)) {
    kind = "invalid";
  }

  return {
    ok: false,
    kind,
    attempts,
    detail: workflowDetail || (kind === "offline"
      ? "The request could not reach n8n at localhost:5678. Ensure n8n is running and your workflow is Active."
      : "")
  };
}
