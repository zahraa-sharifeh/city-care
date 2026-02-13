const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    governorateId: { type: mongoose.Schema.Types.ObjectId, ref: "Governorate", required: true },
    districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },

    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    // REQUIRED location fields
    locationDescription: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    // REQUIRED images (at least 1)
    images: { type: [String], required: true, validate: v => Array.isArray(v) && v.length > 0 },

    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

reportSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Report", reportSchema);
