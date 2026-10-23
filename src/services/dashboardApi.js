import { authHeaders } from "./authToken";

export const DASHBOARD_PROFILE_ENDPOINT = "/api/dashboard/profile";
const REQUEST_TIMEOUT_MS = 10000;

async function readPayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(DASHBOARD_PROFILE_ENDPOINT, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function loadDashboardWorkspace() {
  try {
    const response = await request({
      method: "GET",
      cache: "no-store",
      headers: await authHeaders()
    });
    const payload = await readPayload(response);
    if (!response.ok || !payload || typeof payload !== "object") {
      return { ok: false, status: response.status, detail: payload?.error || "load_failed" };
    }
    return { ok: true, workspace: payload.workspace || null };
  } catch {
    return { ok: false, status: 0, detail: "network_unavailable" };
  }
}

export async function saveDashboardWorkspace(workspace) {
  try {
    const response = await request({
      method: "POST",
      cache: "no-store",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ workspace })
    });
    const payload = await readPayload(response);
    if (!response.ok || !payload || typeof payload !== "object") {
      return { ok: false, status: response.status, detail: payload?.error || "save_failed" };
    }
    return { ok: true, workspace: payload.workspace || workspace };
  } catch {
    return { ok: false, status: 0, detail: "network_unavailable" };
  }
}

export async function clearDashboardWorkspace() {
  try {
    const response = await request({
      method: "DELETE",
      cache: "no-store",
      headers: await authHeaders()
    });
    const payload = await readPayload(response);
    if (!response.ok || !payload || payload.ok !== true) {
      return { ok: false, status: response.status, detail: payload?.error || "delete_failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 0, detail: "network_unavailable" };
  }
}
