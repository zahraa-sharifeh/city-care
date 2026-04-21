const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
