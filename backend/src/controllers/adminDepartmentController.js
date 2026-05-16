const Department = require("../models/Department");

exports.listDepartments = async (req, res) => {
  try {
    const items = await Department.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only super admin can create departments" });
    }
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    if (!name) return res.status(400).json({ message: "Department name is required" });

    const created = await Department.create({ name, description });
    res.status(201).json(created);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: "Department name already exists" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
