const District = require("../models/District");
const { nominatimReverse } = require("./nominatimClient");

/** Approximate bounding box for Lebanon (WGS84). */
function isRoughlyInLebanon(lat, lng) {
  return lat >= 33.02 && lat <= 34.75 && lng >= 34.92 && lng <= 36.65;
}

/** Correct common mobile GPS axis swaps before bounds / Nominatim checks. */
function normalizeIncomingCoords(lat, lng) {
  let la = Number(lat);
  let ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  if (Math.abs(la) > 90 && Math.abs(ln) <= 90) {
    [la, ln] = [ln, la];
  }
  if (!isRoughlyInLebanon(la, ln) && isRoughlyInLebanon(ln, la)) {
    [la, ln] = [ln, la];
  }
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
  return { lat: la, lng: ln };
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Approximate district centers (WGS84) aligned with seedLebanonLocations names.
 * Used when Nominatim is unavailable from cloud hosts (e.g. Render).
 */
const DISTRICT_CENTROIDS = {
  Beirut: { lat: 33.8938, lng: 35.5018 },
  Tripoli: { lat: 34.4333, lng: 35.8333 },
  Zgharta: { lat: 34.398, lng: 35.894 },
  Batroun: { lat: 34.255, lng: 35.658 },
  Bcharre: { lat: 34.251, lng: 36.012 },
  Koura: { lat: 34.346, lng: 35.822 },
  "Minieh - Danniyeh": { lat: 34.577, lng: 36.095 },
  Baabda: { lat: 33.833, lng: 35.544 },
  Matn: { lat: 33.887, lng: 35.662 },
  Kesrouane: { lat: 33.987, lng: 35.689 },
  Byblos: { lat: 34.121, lng: 35.651 },
  "El Chouf": { lat: 33.695, lng: 35.579 },
  Aalay: { lat: 33.885, lng: 35.596 },
  Akkar: { lat: 34.533, lng: 36.133 },
  Saida: { lat: 33.563, lng: 35.368 },
  Sour: { lat: 33.274, lng: 35.194 },
  Jezzine: { lat: 33.542, lng: 35.584 },
  "Bint Jbeil": { lat: 33.118, lng: 35.433 },
  Marjayoun: { lat: 33.361, lng: 35.591 },
  Hasbaiyya: { lat: 33.398, lng: 35.685 },
  Nabatiyeh: { lat: 33.378, lng: 35.484 },
  "Western Bekaa": { lat: 33.726, lng: 35.918 },
  Zahle: { lat: 33.846, lng: 35.901 },
  Rachaiya: { lat: 33.551, lng: 35.924 },
  Baalbek: { lat: 34.005, lng: 36.218 },
  Hermel: { lat: 34.394, lng: 36.384 },
};

const DISTRICT_ALIASES = [
  ["western bekaa", "Western Bekaa"],
  ["west bekaa", "Western Bekaa"],
  ["minieh-danniyeh", "Minieh - Danniyeh"],
  ["minieh danniyeh", "Minieh - Danniyeh"],
  ["danniyeh", "Minieh - Danniyeh"],
  ["keserwan", "Kesrouane"],
  ["keserouane", "Kesrouane"],
  ["jbeil", "Byblos"],
  ["gubla", "Byblos"],
  ["byblos", "Byblos"],
  ["tyre", "Sour"],
  ["sidon", "Saida"],
  ["marjeyoun", "Marjayoun"],
  ["hasbaya", "Hasbaiyya"],
  ["hasbaiya", "Hasbaiyya"],
  ["el chouf", "El Chouf"],
  ["shouf", "El Chouf"],
  ["chouf", "El Chouf"],
  ["aley", "Aalay"],
  ["aalay", "Aalay"],
  ["baalbeck", "Baalbek"],
  ["zahlé", "Zahle"],
  ["zahle", "Zahle"],
  ["rachaya", "Rachaiya"],
  ["rachaiya", "Rachaiya"],
  ["bint jbeil", "Bint Jbeil"],
  ["batroun", "Batroun"],
  ["bcharre", "Bcharre"],
  ["zgharta", "Zgharta"],
  ["tripoli", "Tripoli"],
  ["saida", "Saida"],
  ["sour", "Sour"],
  ["jezzine", "Jezzine"],
  ["nabatiyeh", "Nabatiyeh"],
  ["matn", "Matn"],
  ["baabda", "Baabda"],
  ["koura", "Koura"],
  ["akkar", "Akkar"],
  ["hermel", "Hermel"],
];

const GOVERNORATE_ALIASES = [
  ["mount lebanon", "Mount Lebanon"],
  ["mohafazat mount lebanon", "Mount Lebanon"],
  ["qadaa mount lebanon", "Mount Lebanon"],
  ["north lebanon", "North"],
  ["mohafazat north", "North"],
  ["south lebanon", "South"],
  ["mohafazat south", "South"],
  ["beqaa", "Beqaa"],
  ["bekaa", "Beqaa"],
  ["baalbek hermel", "Baalbek-Hermel"],
  ["baalbek-hermel", "Baalbek-Hermel"],
  ["nabatiye", "Nabatiyeh"],
  ["mohafazat nabatiyeh", "Nabatiyeh"],
  ["beyrouth", "Beirut"],
  ["beirut governorate", "Beirut"],
];

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
}

function collectLocalityTokens(nomi) {
  const set = new Set();
  const addr = nomi.address || {};
  const keys = [
    "village",
    "town",
    "city",
    "municipality",
    "county",
    "state",
    "state_district",
    "city_district",
    "suburb",
    "hamlet",
    "neighbourhood",
    "quarter",
    "road",
  ];
  for (const k of keys) {
    const v = addr[k];
    if (typeof v === "string" && v.trim()) set.add(normalize(v.trim()));
  }
  if (typeof nomi.name === "string" && nomi.name.trim()) set.add(normalize(nomi.name.trim()));
  return [...set];
}

function matchDistrictFromDisplayParts(displayName, rows) {
  if (!displayName) return null;
  const parts = normalize(displayName)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  for (const p of parts) {
    const row = rows.find(r => normalize(r.districtName) === p);
    if (row) return row;
  }
  return null;
}

function buildHaystack(nomi) {
  const chunks = [];
  if (nomi.display_name) chunks.push(nomi.display_name);
  const addr = nomi.address || {};
  for (const v of Object.values(addr)) {
    if (typeof v === "string" && v.trim()) chunks.push(v);
  }
  return normalize(chunks.join(" | "));
}

function resolveGovernorateName(hay, rows) {
  const govNames = [...new Set(rows.map(r => r.governorateName))].sort((a, b) => b.length - a.length);
  for (const name of govNames) {
    const n = normalize(name);
    if (n.length >= 3 && hay.includes(n)) return name;
  }
  const aliasesSorted = [...GOVERNORATE_ALIASES].sort((a, b) => b[0].length - a[0].length);
  for (const [fragment, canonical] of aliasesSorted) {
    const nf = normalize(fragment);
    if (nf.length >= 3 && hay.includes(nf)) return canonical;
  }
  return null;
}

function fallbackMatchByGovernorate(nomi, rows) {
  const hay = buildHaystack(nomi);
  if (!hay) return null;

  const govName = resolveGovernorateName(hay, rows);
  if (!govName) return null;

  const inGov = rows.filter(r => r.governorateName === govName);
  if (inGov.length === 0) return null;

  const tokens = collectLocalityTokens(nomi);
  for (const token of tokens) {
    const exact = inGov.filter(r => normalize(r.districtName) === token);
    if (exact.length === 1) return exact[0];
  }

  for (const row of inGov) {
    const nd = normalize(row.districtName);
    if (nd.length >= 2 && hay.includes(nd)) return row;
  }

  if (inGov.length === 1) return inGov[0];

  return null;
}

function matchNomiToRow(nomi, rows) {
  if (!nomi || nomi.error) return null;

  const hay = buildHaystack(nomi);
  if (!hay) return null;

  const byDistrictName = name => rows.find(r => r.districtName === name);
  const localityTokens = collectLocalityTokens(nomi);

  const exactFromTokens = rows.filter(r => localityTokens.includes(normalize(r.districtName)));
  if (exactFromTokens.length === 1) return exactFromTokens[0];
  if (exactFromTokens.length > 1) {
    const dis = nomi.display_name ? normalize(nomi.display_name) : "";
    const narrowed = exactFromTokens.filter(h => dis.includes(normalize(h.governorateName)));
    return (narrowed.length ? narrowed : exactFromTokens)[0];
  }

  const fromParts = matchDistrictFromDisplayParts(nomi.display_name, rows);
  if (fromParts) return fromParts;

  const aliasesSorted = [...DISTRICT_ALIASES].sort((a, b) => b[0].length - a[0].length);
  for (const [fragment, canonical] of aliasesSorted) {
    const nf = normalize(fragment);
    if (nf.length >= 2 && hay.includes(nf)) {
      const row = byDistrictName(canonical);
      if (row) return row;
    }
  }

  const sortedByLen = [...rows].sort((a, b) => b.districtName.length - a.districtName.length);
  const hits = [];
  for (const row of sortedByLen) {
    const nd = normalize(row.districtName);
    if (nd.length < 2) continue;
    if (!hay.includes(nd)) continue;
    if (row.governorateName === "Baalbek-Hermel" && (nd === "baalbek" || nd === "hermel")) {
      if (nd === "baalbek" && localityTokens.includes("hermel") && !localityTokens.includes("baalbek")) continue;
      if (nd === "hermel" && localityTokens.includes("baalbek") && !localityTokens.includes("hermel")) continue;
    }
    hits.push(row);
  }

  if (hits.length === 0) return fallbackMatchByGovernorate(nomi, rows);
  if (hits.length === 1) return hits[0];

  const ng = normalize;
  const narrowed = hits.filter(h => hay.includes(ng(h.governorateName)));
  return narrowed.length > 0 ? narrowed[0] : hits[0];
}

function nearestDistrictRow(lat, lng, rows) {
  let best = null;
  let bestDist = Infinity;

  for (const row of rows) {
    const c = DISTRICT_CENTROIDS[row.districtName];
    if (!c) continue;
    const d = haversineMeters({ lat, lng }, c);
    if (d < bestDist) {
      bestDist = d;
      best = row;
    }
  }

  return best;
}

async function loadDistrictRows() {
  const districts = await District.find().populate("governorateId", "name").lean();
  return districts.map(d => ({
    districtId: d._id,
    districtName: d.name,
    governorateId: d.governorateId._id,
    governorateName: d.governorateId.name,
  }));
}

function buildResult(row, displayName) {
  return {
    governorateId: row.governorateId,
    districtId: row.districtId,
    governorateName: row.governorateName,
    districtName: row.districtName,
    displayName: displayName || `${row.districtName}, ${row.governorateName}, Lebanon`,
  };
}

async function resolveAdminFromLatLng(lat, lng) {
  const coords = normalizeIncomingCoords(lat, lng);
  if (!coords) return null;
  lat = coords.lat;
  lng = coords.lng;
  if (!isRoughlyInLebanon(lat, lng)) return null;

  const rows = await loadDistrictRows();
  if (rows.length === 0) return null;

  let nomi = null;
  try {
    nomi = await nominatimReverse(lat, lng);
  } catch (err) {
    console.warn("[reverseAdminLookup] Nominatim unavailable:", err.message || err);
  }

  if (nomi && !nomi.error) {
    const matched = matchNomiToRow(nomi, rows);
    if (matched) {
      return buildResult(matched, nomi.display_name || "");
    }
  }

  const nearest = nearestDistrictRow(lat, lng, rows);
  if (nearest) {
    const viaNearest = !nomi || nomi.error;
    const label =
      nomi?.display_name ||
      (viaNearest
        ? `${nearest.districtName}, ${nearest.governorateName}, Lebanon`
        : `${nearest.districtName}, ${nearest.governorateName}, Lebanon`);
    if (viaNearest) {
      console.warn("[reverseAdminLookup] Using nearest-district fallback for", lat, lng, "→", nearest.districtName);
    }
    return buildResult(nearest, label);
  }

  return null;
}

module.exports = { resolveAdminFromLatLng, isRoughlyInLebanon, normalizeIncomingCoords };
