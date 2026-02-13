const Governorate = require("../models/Governorate");
const District = require("../models/District");

// GET /api/governorates
exports.getGovernorates = async (req, res) => {
  try {
    const governorates = await Governorate.find().sort({ name: 1 });
    res.json(governorates);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/districts?governorateId=...
exports.getDistricts = async (req, res) => {
  try {
    const { governorateId } = req.query;

    if (!governorateId) {
      return res.status(400).json({ message: "governorateId query param is required" });
    }

    const districts = await District.find({ governorateId }).sort({ name: 1 });
    res.json(districts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
