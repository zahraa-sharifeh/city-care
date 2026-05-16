const Report = require("../models/Report");
const { parseObjectId } = require("../services/reportAccess");

function buildAdminScopeFilter(user) {
  if (user.role === "SUPER_ADMIN") return {};
  if (user.role === "DISTRICT_ADMIN") {
    if (!user.districtId) return null;
    const districtId = parseObjectId(user.districtId);
    if (!districtId) return null;
    return { districtId };
  }
  return null;
}

function normalizeDateBoundary(raw, endOfDay = false) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
}

exports.getAnalytics = async (req, res) => {
  try {
    const scope = buildAdminScopeFilter(req.user);
    if (scope === null) {
      return res.status(403).json({ message: "District admin must be assigned to a district" });
    }

    const filter = { ...scope };
    const dateFrom = normalizeDateBoundary(req.query.dateFrom, false);
    const dateTo = normalizeDateBoundary(req.query.dateTo, true);
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = dateFrom;
      if (dateTo) filter.createdAt.$lte = dateTo;
    }

    const [total, statusBreakdown, categoryBreakdown, priorityBreakdown, duplicateBreakdown, dailyTrend] = await Promise.all([
      Report.countDocuments(filter),
      Report.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Report.aggregate([
        { $match: filter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      Report.aggregate([
        { $match: filter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Report.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$duplicateReview.status",
            count: { $sum: 1 },
          },
        },
      ]),
      Report.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      total,
      statusBreakdown: statusBreakdown.map(item => ({ key: item._id || "UNKNOWN", count: item.count })),
      categoryBreakdown: categoryBreakdown.map(item => ({ key: item._id || "Other", count: item.count })),
      priorityBreakdown: priorityBreakdown.map(item => ({ key: item._id || "MEDIUM", count: item.count })),
      duplicateBreakdown: duplicateBreakdown.map(item => ({ key: item._id || "PENDING_REVIEW", count: item.count })),
      dailyTrend: dailyTrend.map(item => ({ date: item._id, count: item.count })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
