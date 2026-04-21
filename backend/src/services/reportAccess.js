const mongoose = require("mongoose");

function adminCanAccessReport(user, report) {
  if (!user || user.type !== "admin") return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "DISTRICT_ADMIN") {
    if (!user.districtId || !report.districtId) return false;
    return String(user.districtId) === String(report.districtId);
  }
  return false;
}

function citizenOwnsReport(user, report) {
  return user && user.type === "citizen" && report.userId && String(report.userId) === String(user.id);
}

function parseObjectId(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

module.exports = { adminCanAccessReport, citizenOwnsReport, parseObjectId };
