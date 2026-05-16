const mongoose = require("mongoose");

const reportLikeSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

reportLikeSchema.index({ reportId: 1, userId: 1 }, { unique: true });
reportLikeSchema.index({ reportId: 1 });

module.exports = mongoose.model("ReportLike", reportLikeSchema);
