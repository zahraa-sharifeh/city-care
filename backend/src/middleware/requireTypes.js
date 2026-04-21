function requireCitizen(req, res, next) {
  if (!req.user || req.user.type !== "citizen") {
    return res.status(403).json({ message: "Citizen access required" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.type !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

module.exports = { requireCitizen, requireAdmin };
