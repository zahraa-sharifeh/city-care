export const getApiBase = () => (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const base = getApiBase;

function networkErrorMessage() {
  const api = getApiBase();
  if (/localhost|127\.0\.0\.1/.test(api)) {
    return "Cannot reach the API from this device. Set REACT_APP_API_URL to your public API URL on Netlify, then redeploy.";
  }
  return `Cannot reach the server (${api}). Check your connection and try again.`;
}

export function getAdminToken() {
  return localStorage.getItem("admin_token");
}

export function setAdminToken(token) {
  if (token) localStorage.setItem("admin_token", token);
  else localStorage.removeItem("admin_token");
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${base()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAdminToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error(networkErrorMessage());
  }
  const data = await parseJson(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/** Same auth as `apiFetch`, but returns a `Blob` for non-JSON responses (e.g. CSV). */
export async function apiFetchBlob(path, options = {}) {
  const url = `${base()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});
  const token = getAdminToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const data = await parseJson(res);
    const err = new Error(data?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return res.blob();
}
