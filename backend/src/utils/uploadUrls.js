/**
 * Report images are stored as relative paths: /uploads/<filename> or /api/files/<id>.
 * API responses keep paths relative; frontends prepend REACT_APP_API_URL.
 */

function getApiPublicBase(req) {
  const fromEnv = (process.env.PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (!req) return "";
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("x-forwarded-host") || req.get("host") || "";
  return host ? `${proto}://${host}` : "";
}

function extractUploadPath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/api/files/") || trimmed.startsWith("/uploads/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/api/files/") || parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
  } catch {
    /* relative or invalid */
  }
  if (trimmed.startsWith("api/files/")) return `/${trimmed}`;
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;
  return "";
}

/** Always return a relative media path for JSON API responses. */
function toRelativeMediaPath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const uploadPath = extractUploadPath(trimmed);
  if (uploadPath) return uploadPath;

  if (!trimmed.includes("/")) return `/uploads/${trimmed}`;
  return "";
}

/** Full URL for PDF export / e-mail (optional). */
function resolveUploadUrl(value, req) {
  const relative = toRelativeMediaPath(value);
  if (!relative) {
    if (/^https?:\/\//i.test(String(value || "").trim())) return String(value).trim();
    return "";
  }
  const base = getApiPublicBase(req);
  return base ? `${base}${relative}` : relative;
}

function normalizeReportImages(report) {
  if (!report) return report;
  const out = report.toObject ? report.toObject({ virtuals: true }) : { ...report };
  if (Array.isArray(out.images)) {
    out.images = out.images.map(url => toRelativeMediaPath(url)).filter(Boolean);
  }
  return out;
}

function normalizeReportsList(items) {
  return (items || []).map(item => normalizeReportImages(item));
}

module.exports = {
  getApiPublicBase,
  toRelativeMediaPath,
  resolveUploadUrl,
  normalizeReportImages,
  normalizeReportsList,
};
