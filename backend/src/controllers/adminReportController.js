const Report = require("../models/Report");
const { adminCanAccessReport, parseObjectId } = require("../services/reportAccess");

const STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];

function buildAdminScopeFilter(user) {
  if (user.role === "SUPER_ADMIN") return {};
  if (user.role === "DISTRICT_ADMIN") {
    if (!user.districtId) return null;
    return { districtId: user.districtId };
  }
  return null;
}

exports.listReports = async (req, res) => {
  try {
    const scope = buildAdminScopeFilter(req.user);
    if (scope === null) {
      return res.status(403).json({ message: "District admin must be assigned to a district" });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { ...scope };
    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.user.role === "SUPER_ADMIN" && req.query.districtId) {
      const did = parseObjectId(req.query.districtId);
      if (did) filter.districtId = did;
    }

    const [items, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("governorateId", "name")
        .populate("districtId", "name")
        .populate("userId", "fullName email")
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("governorateId", "name")
      .populate("districtId", "name")
      .populate("userId", "fullName email");
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!adminCanAccessReport(req.user, report)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!adminCanAccessReport(req.user, report)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    report.status = status;
    await report.save();

    const populated = await Report.findById(report._id)
      .populate("governorateId", "name")
      .populate("districtId", "name")
      .populate("userId", "fullName email");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
