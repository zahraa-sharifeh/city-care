/** Citizen password rules (must match backend). */
export function validatePassword(password) {
  const p = String(password || "");
  if (p.length < 8) {
    return { ok: false, code: "tooShort" };
  }
  if (!/[a-z]/.test(p)) {
    return { ok: false, code: "needsLower" };
  }
  if (!/[A-Z]/.test(p)) {
    return { ok: false, code: "needsUpper" };
  }
  if (!/[0-9]/.test(p)) {
    return { ok: false, code: "needsDigit" };
  }
  return { ok: true };
}

export function passwordPolicyMessage(t, code) {
  switch (code) {
    case "tooShort":
      return t("auth.passwordTooShort");
    case "needsLower":
      return t("auth.passwordNeedsLower");
    case "needsUpper":
      return t("auth.passwordNeedsUpper");
    case "needsDigit":
      return t("auth.passwordNeedsDigit");
    default:
      return t("auth.passwordWeak");
  }
}
