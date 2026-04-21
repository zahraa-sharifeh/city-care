const Report = require("../models/Report");
const District = require("../models/District");
const { citizenOwnsReport } = require("../services/reportAccess");

const populateReport = [
  { path: "governorateId", select: "name" },
  { path: "districtId", select: "name" },
];

exports.createReport = async (req, res) => {
  try {
    const {
      category,
      description,
      governorateId,
      districtId,
      locationDescription,
      lat,
      lng,
    } = req.body;

    if (!category || !description || !governorateId || !districtId || !locationDescription) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ message: "At least 1 image is required" });

    const district = await District.findOne({ _id: districtId, governorateId });
    if (!district) return res.status(400).json({ message: "District does not belong to selected governorate" });

    const imageUrls = files.map(f => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`);

    const created = await Report.create({
      userId: req.user.id,
      category,
      description,
      governorateId,
      districtId,
      locationDescription,
      location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
      images: imageUrls,
    });

    const report = await Report.findById(created._id).populate(populateReport);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.listMine = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    const [items, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(populateReport)
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMineById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate(populateReport);
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (!citizenOwnsReport(req.user, report)) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
