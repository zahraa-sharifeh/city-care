/**
 * Report images are stored as `/uploads/<filename>` in MongoDB.
 * Full URLs are resolved on read using PUBLIC_API_URL or the incoming request.
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

function resolveUploadUrl(value, req) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const uploadPath = extractUploadPath(trimmed);
  if (uploadPath) {
    const base = getApiPublicBase(req);
    return base ? `${base}${uploadPath}` : uploadPath;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed;
}

function normalizeReportImages(report, req) {
  if (!report) return report;
  const out = report.toObject ? report.toObject({ virtuals: true }) : { ...report };
  if (Array.isArray(out.images)) {
    out.images = out.images.map(url => resolveUploadUrl(url, req));
  }
  return out;
}

function normalizeReportsList(items, req) {
  return (items || []).map(item => normalizeReportImages(item, req));
}

function storedUploadPath(filename) {
  return `/uploads/${filename}`;
}

function storedFilePath(fileId) {
  return `/api/files/${fileId}`;
}

module.exports = {
  getApiPublicBase,
  resolveUploadUrl,
  normalizeReportImages,
  normalizeReportsList,
  storedUploadPath,
  storedFilePath,
};
