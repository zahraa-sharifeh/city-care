const Report = require("../models/Report");

function toCoords(report) {
  const coords = report?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
  return R * c;
}

/**
 * Same rules as admin duplicate suggestions: same district, category, ±72h, ≤500m.
 * @param {object} report - Mongoose doc or plain object with _id, districtId, category, createdAt, location
 * @param {object} scope - extra $match (e.g. { districtId } for admin scope)
 */
async function findDuplicateCandidates(report, scope = {}) {
  const origin = toCoords(report);
  if (!origin) return [];
  const windowMs = 72 * 60 * 60 * 1000;
  const createdAt = report.createdAt ? new Date(report.createdAt) : new Date();
  const createdFrom = new Date(createdAt.getTime() - windowMs);
  const createdTo = new Date(createdAt.getTime() + windowMs);
  const base = {
    _id: { $ne: report._id },
    districtId: report.districtId,
    category: report.category,
    createdAt: { $gte: createdFrom, $lte: createdTo },
    ...scope,
  };

  const candidates = await Report.find(base)
    .sort({ createdAt: -1 })
    .limit(25)
    .populate("districtId", "name")
    .populate("userId", "fullName email")
    .lean();

  return candidates
    .map(item => {
      const coords = toCoords(item);
      if (!coords) return null;
      const distanceMeters = Math.round(haversineMeters(origin, coords));
      if (distanceMeters > 500) return null;
      return { ...item, duplicateDistanceMeters: distanceMeters };
    })
    .filter(Boolean)
    .sort((a, b) => a.duplicateDistanceMeters - b.duplicateDistanceMeters);
}

/**
 * Pick a primary report for auto-linking: must not already be a confirmed duplicate child
 * (those point at another report). Prefer open statuses, then oldest createdAt, then nearest distance.
 */
function pickAutoDuplicatePrimary(candidates) {
  if (!candidates || candidates.length === 0) return null;

  const pool = candidates.filter(c => c.duplicateReview?.status !== "CONFIRMED_DUPLICATE");
  if (!pool.length) return null;

  const open = pool.filter(c => c.status === "PENDING" || c.status === "IN_PROGRESS");
  const pool2 = open.length ? open : pool.filter(c => c.status !== "REJECTED");
  const pool3 = pool2.length ? pool2 : pool;

  return [...pool3].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    return (a.duplicateDistanceMeters || 0) - (b.duplicateDistanceMeters || 0);
  })[0];
}

module.exports = { findDuplicateCandidates, pickAutoDuplicatePrimary, toCoords, haversineMeters };
