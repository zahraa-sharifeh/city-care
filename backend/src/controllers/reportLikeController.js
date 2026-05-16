const Report = require("../models/Report");
const ReportLike = require("../models/ReportLike");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { parseObjectId } = require("../services/reportAccess");

exports.getLikeSummary = async (req, res) => {
  try {
    const reportId = parseObjectId(req.params.id);
    if (!reportId) return res.status(400).json({ message: "Invalid report id" });

    const exists = await Report.exists({ _id: reportId });
    if (!exists) return res.status(404).json({ message: "Report not found" });

    const count = await ReportLike.countDocuments({ reportId });

    let likedByMe = false;
    if (req.user?.type === "citizen" && req.user?.id) {
      const userId = parseObjectId(req.user.id);
      if (userId) {
        likedByMe = Boolean(await ReportLike.exists({ reportId, userId }));
      }
    }

    res.json({ count, likedByMe });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    if (req.user.type !== "citizen") {
      return res.status(403).json({ message: "Only citizens can like reports" });
    }

    const reportId = parseObjectId(req.params.id);
    const userId = parseObjectId(req.user.id);
    if (!reportId || !userId) return res.status(400).json({ message: "Invalid id" });

    const exists = await Report.exists({ _id: reportId });
    if (!exists) return res.status(404).json({ message: "Report not found" });

    const existing = await ReportLike.findOne({ reportId, userId });
    if (existing) {
      await existing.deleteOne();
    } else {
      await ReportLike.create({ reportId, userId });

      const report = await Report.findById(reportId).select("userId category status").lean();
      const ownerId = report?.userId ? String(report.userId) : null;
      const likerId = String(userId);
      if (report && ownerId && ownerId !== likerId) {
        try {
          const actor = await User.findById(userId).select("fullName").lean();
          const name = (actor && actor.fullName) || "Someone";
          await Notification.create({
            userId: report.userId,
            reportId,
            type: "REPORT_LIKE",
            title: "Someone liked your report",
            message: `${name} supported your "${report.category}" report.`,
            data: {
              status: report.status,
              previousStatus: "",
              category: report.category,
              actorName: name,
            },
          });
        } catch (notifyErr) {
          console.error("Like notification failed:", notifyErr.message);
        }
      }
    }

    const count = await ReportLike.countDocuments({ reportId });
    const likedByMe = Boolean(await ReportLike.exists({ reportId, userId }));

    res.json({ count, likedByMe });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
