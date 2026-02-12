const mongoose = require("mongoose");
const validator = require("validator");

const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Invalid email"],
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["DISTRICT_ADMIN", "SUPER_ADMIN"], default: "DISTRICT_ADMIN" },
    districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
