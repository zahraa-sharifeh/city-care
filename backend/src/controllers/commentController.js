const Comment = require("../models/Comment");
const Report = require("../models/Report");
const { adminCanAccessReport, citizenOwnsReport } = require("../services/reportAccess");

async function loadReportOr404(id) {
  const report = await Report.findById(id);
  return report;
}

function canViewComments(user, report) {
  if (!report) return false;
  if (user.type === "citizen" && citizenOwnsReport(user, report)) return true;
  if (user.type === "admin" && adminCanAccessReport(user, report)) return true;
  return false;
}

exports.addComment = async (req, res) => {
  try {
    const report = await loadReportOr404(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (req.user.type !== "citizen" || !citizenOwnsReport(req.user, report)) {
      return res.status(403).json({ message: "Only the report owner can comment" });
    }

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text is required" });

    const comment = await Comment.create({
      reportId: req.params.id,
      userId: req.user.id,
      text: text.trim(),
    });

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
      return res.status(403).json({ message: "Forbidden" });
    }

    const comments = await Comment.find({ reportId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
