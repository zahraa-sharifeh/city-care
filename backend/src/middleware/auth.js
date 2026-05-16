const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, type, role?, districtId? }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

/** Sets req.user when a valid Bearer token is present; otherwise continues (for public routes). */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    /* anonymous */
  }
  next();
}

module.exports = auth;
auth.optionalAuth = optionalAuth;
