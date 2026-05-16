const jwt = require("jsonwebtoken");

/** Sets `req.user` when a valid Bearer token is sent; otherwise `req.user` is null. */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

module.exports = optionalAuth;
