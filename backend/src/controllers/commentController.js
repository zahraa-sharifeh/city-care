const Comment = require("../models/Comment");

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text is required" });

    const comment = await Comment.create({
      reportId: req.params.id,
      userId: req.user.id,
      text: text.trim(),
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ reportId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
