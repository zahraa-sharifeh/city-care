const mongoose = require("mongoose");

function normalizeId(value) {
  if (!value) return null;
  if (typeof value === "object" && value._id) return value._id;
  return value;
}

function adminCanAccessReport(user, report) {
  if (!user || user.type !== "admin") return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "DISTRICT_ADMIN") {
    const userDistrictId = normalizeId(user.districtId);
    const reportDistrictId = normalizeId(report.districtId);
    if (!userDistrictId || !reportDistrictId) return false;
    return String(userDistrictId) === String(reportDistrictId);
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
