const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    type: {
      type: String,
      enum: ["REPORT_STATUS", "REPORT_COMMENT", "REPORT_LIKE"],
      default: "REPORT_STATUS",
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    data: {
      status: { type: String, default: "" },
      previousStatus: { type: String, default: "" },
      category: { type: String, default: "" },
      statusNote: { type: String, default: "" },
      actorName: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
