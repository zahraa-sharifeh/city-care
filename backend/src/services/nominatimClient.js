/** Shared Nominatim client (Usage Policy: identify app; server-side only from browser apps). */

const USER_AGENT =
  "CityCare-Lebanon/1.0 (Lebanon civic issue reporting; https://citycarelb.netlify.app; github.com/zahraa-sharifeh/city-care)";

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
  "User-Agent": USER_AGENT,
  Referer: "https://citycarelb.netlify.app/",
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {string} url
 * @param {number} timeoutMs
 */
async function nominatimFetch(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: NOMINATIM_HEADERS,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text ? `Nominatim HTTP ${res.status}: ${text.slice(0, 120)}` : `Nominatim HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} q
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
async function nominatimSearch(q, opts = {}) {
  const limit = Math.min(10, Math.max(1, opts.limit || 5));
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "lb");
  url.searchParams.set("addressdetails", "0");

  const data = await nominatimFetch(url.toString(), 15000);
  return Array.isArray(data) ? data : [];
}

/**
 * Reverse geocode with retries (OSM rate limit + cloud IP blocks).
 * @param {number} lat
 * @param {number} lng
 * @param {{ attempts?: number }} [opts]
 * @returns {Promise<Record<string, unknown>>}
 */
async function nominatimReverse(lat, lng, opts = {}) {
  const attempts = Math.min(4, Math.max(1, opts.attempts || 3));
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "14");
  url.searchParams.set("addressdetails", "1");

  let lastError = null;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(1100);
    try {
      return await nominatimFetch(url.toString(), 14000);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Nominatim reverse failed");
}

module.exports = { nominatimSearch, nominatimReverse, USER_AGENT };
