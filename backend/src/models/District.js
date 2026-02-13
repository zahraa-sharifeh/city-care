const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    governorateId: { type: mongoose.Schema.Types.ObjectId, ref: "Governorate", required: true },
  },
  { timestamps: true }
);

districtSchema.index({ name: 1, governorateId: 1 }, { unique: true });

module.exports = mongoose.model("District", districtSchema);
