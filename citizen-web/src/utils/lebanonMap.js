import L from "leaflet";

/** Approximate bounding box for Lebanon (south-west → north-east). */
export const LEBANON_SW = [33.047, 35.104];
export const LEBANON_NE = [34.692, 36.611];
export const LEBANON_CENTER = [33.8938, 35.5018];
export const LEBANON_DEFAULT_ZOOM = 10;
export const LEBANON_MIN_ZOOM = 8;
export const LEBANON_MAX_ZOOM = 18;

export const LEBANON_BOUNDS = L.latLngBounds(LEBANON_SW, LEBANON_NE);

export function getLebanonMapOptions(extra = {}) {
  return {
    maxBounds: LEBANON_BOUNDS,
    maxBoundsViscosity: 1,
    minZoom: LEBANON_MIN_ZOOM,
    maxZoom: LEBANON_MAX_ZOOM,
    ...extra,
  };
}

export function clampLatLng(lat, lng) {
  return {
    lat: Math.min(Math.max(Number(lat), LEBANON_SW[0]), LEBANON_NE[0]),
    lng: Math.min(Math.max(Number(lng), LEBANON_SW[1]), LEBANON_NE[1]),
  };
}

export function clampLatLngPair([lat, lng]) {
  const c = clampLatLng(lat, lng);
  return [c.lat, c.lng];
}

export function isInLebanon(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  return LEBANON_BOUNDS.contains([la, ln]);
}

/** Backend uses a slightly tighter box; keep GPS normalization aligned with it. */
function isRoughlyInLebanon(lat, lng) {
  return lat >= 33.02 && lat <= 34.75 && lng >= 34.92 && lng <= 36.65;
}

/**
 * Fix swapped or mis-labelled lat/lng from mobile Geolocation before map/reverse lookup.
 * @returns {{ lat: number, lng: number } | null}
 */
export function normalizeGpsCoordinates(rawLat, rawLng) {
  let lat = Number(rawLat);
  let lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    [lat, lng] = [lng, lat];
  }

  if (!isRoughlyInLebanon(lat, lng) && isRoughlyInLebanon(lng, lat)) {
    [lat, lng] = [lng, lat];
  }

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/**
 * Fit the map to report/pin points, clamped to Lebanon. Falls back to country view.
 * @param {L.Map} map
 * @param {Array<{lat:number,lng:number}|number[]>} points
 * @param {{ padding?: number[], maxZoom?: number }} [options]
 */
export function fitMapToPoints(map, points, options = {}) {
  const pairs = (points || [])
    .map(p => {
      if (Array.isArray(p) && p.length >= 2) return clampLatLngPair([p[0], p[1]]);
      if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) return clampLatLngPair([p.lat, p.lng]);
      return null;
    })
    .filter(Boolean);

  if (pairs.length === 0) {
    map.setView(LEBANON_CENTER, LEBANON_DEFAULT_ZOOM);
    return;
  }

  if (pairs.length === 1) {
    map.setView(pairs[0], Math.min(options.maxZoom ?? 14, LEBANON_MAX_ZOOM));
    return;
  }

  map.fitBounds(L.latLngBounds(pairs), {
    padding: options.padding ?? [48, 48],
    maxZoom: options.maxZoom ?? 14,
  });
}
