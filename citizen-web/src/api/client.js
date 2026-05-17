export const getApiBase = () => (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const base = getApiBase;

function networkErrorMessage() {
  const api = getApiBase();
  if (/localhost|127\.0\.0\.1/.test(api)) {
    return "Cannot reach the API from this device. The app is pointing at localhost — set REACT_APP_API_URL to your public API URL on Netlify, then redeploy.";
  }
  return `Cannot reach the server (${api}). Check your internet connection and try again.`;
}

export function getToken() {
  return localStorage.getItem("citizen_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("citizen_token", token);
  else localStorage.removeItem("citizen_token");
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
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let res;
  try {
    res = await fetch(url, {
      cache: options.cache ?? "no-store",
      ...options,
      headers,
    });
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
