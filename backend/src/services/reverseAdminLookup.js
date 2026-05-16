const District = require("../models/District");

/** Approximate bounding box for Lebanon (WGS84). */
function isRoughlyInLebanon(lat, lng) {
  return lat >= 33.02 && lat <= 34.75 && lng >= 34.92 && lng <= 36.65;
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
 * OSM / colloquial fragments → exact district `name` in DB (see seedLebanonLocations).
 * Longer aliases first (handled by caller sort).
 */
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
];

/** OSM address + map name tokens — exact district name match, avoids "Baalbek" inside "Baalbek-Hermel" slug. */
function collectLocalityTokens(nomi) {
  const set = new Set();
  const addr = nomi.address || {};
  const keys = ["village", "town", "city", "municipality", "county", "city_district", "suburb", "hamlet", "neighbourhood", "quarter"];
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

async function nominatimReverse(lat, lng) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "14");
  url.searchParams.set("addressdetails", "1");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "CityCareIssueReporting/1.0 (civic issue reporting; +https://github.com/)",
      },
    });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
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

/**
 * @returns {Promise<{ governorateId: import('mongoose').Types.ObjectId, districtId: import('mongoose').Types.ObjectId, governorateName: string, districtName: string, displayName: string } | null>}
 */
async function resolveAdminFromLatLng(lat, lng) {
  if (!isRoughlyInLebanon(lat, lng)) return null;

  let nomi;
  try {
    nomi = await nominatimReverse(lat, lng);
  } catch {
    return null;
  }

  if (!nomi || nomi.error) return null;

  const hay = buildHaystack(nomi);
  if (!hay) return null;

  const districts = await District.find().populate("governorateId", "name").lean();
  const rows = districts.map(d => ({
    districtId: d._id,
    districtName: d.name,
    governorateId: d.governorateId._id,
    governorateName: d.governorateId.name,
  }));

  const byDistrictName = name => rows.find(r => r.districtName === name);

  const localityTokens = collectLocalityTokens(nomi);

  function resultFromRow(row) {
    return {
      governorateId: row.governorateId,
      districtId: row.districtId,
      governorateName: row.governorateName,
      districtName: row.districtName,
      displayName: nomi.display_name || "",
    };
  }

  const exactFromTokens = rows.filter(r => localityTokens.includes(normalize(r.districtName)));
  if (exactFromTokens.length === 1) {
    return resultFromRow(exactFromTokens[0]);
  }
  if (exactFromTokens.length > 1) {
    const dis = nomi.display_name ? normalize(nomi.display_name) : "";
    const narrowed = exactFromTokens.filter(h => dis.includes(normalize(h.governorateName)));
    return resultFromRow((narrowed.length ? narrowed : exactFromTokens)[0]);
  }

  const fromParts = matchDistrictFromDisplayParts(nomi.display_name, rows);
  if (fromParts) {
    return resultFromRow(fromParts);
  }

  const aliasesSorted = [...DISTRICT_ALIASES].sort((a, b) => b[0].length - a[0].length);
  for (const [fragment, canonical] of aliasesSorted) {
    const nf = normalize(fragment);
    if (nf.length >= 2 && hay.includes(nf)) {
      const row = byDistrictName(canonical);
      if (row) {
        return resultFromRow(row);
      }
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

  if (hits.length === 0) return null;

  if (hits.length === 1) {
    return resultFromRow(hits[0]);
  }

  const ng = normalize;
  const narrowed = hits.filter(h => hay.includes(ng(h.governorateName)));
  const pick = narrowed.length > 0 ? narrowed[0] : hits[0];
  return resultFromRow(pick);
}

module.exports = { resolveAdminFromLatLng, isRoughlyInLebanon };
