const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
  },
  { timestamps: true }
);

commentSchema.index({ reportId: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
