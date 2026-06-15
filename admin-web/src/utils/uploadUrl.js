import { getApiBase } from "../api/client";

function extractMediaPath(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/api/files/") || trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/api/files/") || parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
  } catch {
    /* not a full URL */
  }

  return "";
}

/** Turn stored paths or legacy localhost URLs into the configured API URL. */
export function resolveUploadUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";

  const apiBase = getApiBase();
  const mediaPath = extractMediaPath(trimmed);

  if (mediaPath) {
    return `${apiBase}${mediaPath}`;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (!trimmed.includes("/")) {
    return `${apiBase}/uploads/${trimmed}`;
  }

  return `${apiBase}/${trimmed.replace(/^\//, "")}`;
}

export function resolveUploadUrls(urls) {
  return (urls || []).map(resolveUploadUrl).filter(Boolean);
}
