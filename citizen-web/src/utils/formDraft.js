/**
 * Persist form field values in sessionStorage (survives reload, cleared when tab closes).
 */

export function readFormDraft(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export function writeFormDraft(key, data) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota or private mode */
  }
}

export function clearFormDraft(key) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
