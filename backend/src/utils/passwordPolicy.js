function validatePassword(password) {
  const p = String(password || "");
  if (p.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (!/[a-z]/.test(p)) {
    return { ok: false, message: "Password must include a lowercase letter." };
  }
  if (!/[A-Z]/.test(p)) {
    return { ok: false, message: "Password must include an uppercase letter." };
  }
  if (!/[0-9]/.test(p)) {
    return { ok: false, message: "Password must include a number." };
  }
  return { ok: true };
}

module.exports = { validatePassword };
