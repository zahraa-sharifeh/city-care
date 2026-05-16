const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
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
    googleId: { type: String, unique: true, sparse: true, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District", default: null },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
