const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const District = require("../models/District");
const { validatePassword } = require("../utils/passwordPolicy");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// CITIZEN REGISTER
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, districtId } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email, password are required" });
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      districtId: districtId || null,
    });

    const token = signToken({ id: user._id, type: "citizen" });

    return res.status(201).json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, districtId: user.districtId },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// CITIZEN LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: user._id, type: "citizen" });

    return res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, districtId: user.districtId },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

let googleOAuthClient;
function getGoogleClientId() {
  return (process.env.GOOGLE_CLIENT_ID || "").trim();
}
function getGoogleOAuthClient() {
  const id = getGoogleClientId();
  if (!id) return null;
  if (!googleOAuthClient) googleOAuthClient = new OAuth2Client(id);
  return googleOAuthClient;
}

/** POST body: { credential } — Google Identity Services ID token (JWT). */
exports.googleCitizen = async (req, res) => {
  try {
    const client = getGoogleOAuthClient();
    if (!client) {
      return res.status(503).json({ message: "Google sign-in is not configured on this server." });
    }

    const credential = String(req.body?.credential || "").trim();
    if (!credential) {
      return res.status(400).json({ message: "credential (Google ID token) is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: getGoogleClientId(),
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ message: "Google account has no email address" });
    }
    if (payload.email_verified === false) {
      return res.status(401).json({ message: "Google email must be verified" });
    }

    const email = String(payload.email).toLowerCase().trim();
    const sub = String(payload.sub || "");
    if (!sub) return res.status(401).json({ message: "Invalid Google token" });

    let rawName = String(payload.name || "").trim();
    if (rawName.length < 2) rawName = email.split("@")[0] || "Citizen";
    if (rawName.length < 2) rawName = "Citizen";

    let user = await User.findOne({ googleId: sub });
    if (user) {
      if (rawName.length >= 2 && user.fullName !== rawName) {
        user.fullName = rawName;
        await user.save();
      }
    } else {
      user = await User.findOne({ email });
      if (user) {
        if (user.googleId && user.googleId !== sub) {
          return res.status(409).json({ message: "This email is linked to a different Google account." });
        }
        user.googleId = sub;
        if (rawName.length >= 2) user.fullName = rawName;
        await user.save();
      } else {
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
        user = await User.create({
          fullName: rawName,
          email,
          passwordHash,
          googleId: sub,
        });
      }
    }

    const token = signToken({ id: user._id, type: "citizen" });
    return res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, districtId: user.districtId },
    });
  } catch (err) {
    console.error("googleCitizen:", err.message);
    return res.status(401).json({ message: "Google sign-in failed. Try again or use email and password." });
  }
};

// CITIZEN CHANGE PASSWORD (authenticated)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    return res.json({ message: "Password updated" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// CITIZEN FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "email is required" });

    const generic = { message: "If an account with this email exists, reset instructions were generated." };
    const user = await User.findOne({ email });
    if (!user) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // No email service configured yet; return preview token for non-production/testing.
    if (process.env.NODE_ENV !== "production") {
      return res.json({ ...generic, previewResetToken: rawToken, expiresInMinutes: 15 });
    }
    return res.json(generic);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// CITIZEN RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!token || !newPassword) {
      return res.status(400).json({ message: "token and newPassword are required" });
    }
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    return res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// CITIZEN PROFILE
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "districtId",
      select: "name governorateId",
      populate: { path: "governorateId", select: "name" },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        districtId: user.districtId || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { fullName, email, districtId } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName !== undefined) {
      const nextName = String(fullName).trim();
      if (nextName.length < 2) return res.status(400).json({ message: "fullName must be at least 2 characters" });
      user.fullName = nextName;
    }

    if (email !== undefined) {
      const nextEmail = String(email).toLowerCase().trim();
      if (!nextEmail) return res.status(400).json({ message: "email is required" });
      const existing = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ message: "Email already in use" });
      if (nextEmail !== user.email && user.googleId) {
        user.set("googleId", undefined);
        user.markModified("googleId");
      }
      user.email = nextEmail;
    }

    if (districtId !== undefined) {
      if (!districtId) {
        user.districtId = null;
      } else {
        const district = await District.findById(districtId);
        if (!district) return res.status(400).json({ message: "Invalid districtId" });
        user.districtId = district._id;
      }
    }

    await user.save();

    const updated = await User.findById(user._id).populate({
      path: "districtId",
      select: "name governorateId",
      populate: { path: "governorateId", select: "name" },
    });

    return res.json({
      message: "Profile updated",
      user: {
        id: updated._id,
        fullName: updated.fullName,
        email: updated.email,
        districtId: updated.districtId || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ADMIN LOGIN
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({
      id: admin._id,
      type: "admin",
      role: admin.role,
      districtId: admin.districtId || null,
    });

    return res.json({
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        districtId: admin.districtId,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
