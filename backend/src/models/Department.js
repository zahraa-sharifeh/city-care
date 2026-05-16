const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 400 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

departmentSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);
