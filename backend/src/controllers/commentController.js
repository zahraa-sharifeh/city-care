const Comment = require("../models/Comment");
const Report = require("../models/Report");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { adminCanAccessReport } = require("../services/reportAccess");

async function loadReportOr404(id) {
  const report = await Report.findById(id);
  return report;
}

function canViewComments(user, report) {
  if (!report || !user) return false;
  if (user.type === "citizen") return true;
  if (user.type === "admin" && adminCanAccessReport(user, report)) return true;
  return false;
}

exports.addComment = async (req, res) => {
  try {
    const report = await loadReportOr404(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (req.user.type !== "citizen") {
      return res.status(403).json({ message: "Only citizens can comment" });
    }

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text is required" });

    const comment = await Comment.create({
      reportId: req.params.id,
      userId: req.user.id,
      text: text.trim(),
    });

    const ownerId = report.userId ? String(report.userId) : null;
    const actorId = String(req.user.id);
    if (ownerId && ownerId !== actorId) {
      try {
        const actor = await User.findById(req.user.id).select("fullName").lean();
        const name = (actor && actor.fullName) || "Someone";
        const preview = text.trim().slice(0, 140);
        const clipped = text.trim().length > 140 ? `${preview}…` : preview;
        await Notification.create({
          userId: report.userId,
          reportId: report._id,
          type: "REPORT_COMMENT",
          title: "New comment on your report",
          message: `${name} commented on "${report.category}": ${clipped}`,
          data: {
            status: report.status,
            previousStatus: "",
            category: report.category,
            actorName: name,
          },
        });
      } catch (notifyErr) {
        console.error("Comment notification failed:", notifyErr.message);
      }
    }

    const populated = await Comment.findById(comment._id).populate("userId", "fullName");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const report = await loadReportOr404(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!canViewComments(req.user, report)) {
      return res.status(403).json({ message: "Sign in to view comments" });
    }

    const comments = await Comment.find({ reportId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
