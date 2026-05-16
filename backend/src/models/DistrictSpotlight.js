const mongoose = require("mongoose");

const spotlightEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    summary: { type: String, trim: true, default: "", maxlength: 2000 },
    startsAt: { type: Date, default: null },
    venue: { type: String, trim: true, default: "", maxlength: 300 },
    url: { type: String, trim: true, default: "", maxlength: 2000 },
  },
  { _id: true }
);

const districtSpotlightSchema = new mongoose.Schema(
  {
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
      unique: true,
    },
    essay: { type: String, default: "", trim: true, maxlength: 20000 },
    heritageInfo: { type: String, default: "", trim: true, maxlength: 20000 },
    events: { type: [spotlightEventSchema], default: [] },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DistrictSpotlight", districtSpotlightSchema);
