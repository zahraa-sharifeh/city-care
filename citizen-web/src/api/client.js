const base = () => (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

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
  const res = await fetch(url, { ...options, headers });
  const data = await parseJson(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}
