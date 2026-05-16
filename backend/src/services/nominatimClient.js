/** Shared Nominatim client (Usage Policy: identify app; server-side only from browser apps). */

const USER_AGENT = "CityCareIssueReporting/1.0 (civic issue reporting; +https://github.com/)";

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": USER_AGENT,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text ? `Geocoding failed (${res.status})` : `Geocoding failed (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { nominatimSearch, USER_AGENT };
