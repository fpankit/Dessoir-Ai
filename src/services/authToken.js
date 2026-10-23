let tokenProvider = null;

export function setAuthTokenProvider(provider) {
  tokenProvider = typeof provider === "function" ? provider : null;
}

export function clearAuthToken() {
  tokenProvider = null;
}

export async function getAuthToken() {
  if (!tokenProvider) return "";
  try {
    const token = await tokenProvider();
    return typeof token === "string" ? token : "";
  } catch {
    return "";
  }
}

export async function authHeaders(extra = {}) {
  const token = await getAuthToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}
