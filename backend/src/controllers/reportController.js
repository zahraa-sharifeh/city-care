const Report = require("../models/Report");
const District = require("../models/District");

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

    // images required
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ message: "At least 1 image is required" });

    // validate district belongs to governorate
    const district = await District.findOne({ _id: districtId, governorateId });
    if (!district) return res.status(400).json({ message: "District does not belong to selected governorate" });

    const imageUrls = files.map(f => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`);

    const report = await Report.create({
      userId: req.user.id,
      category,
      description,
      governorateId,
      districtId,
      locationDescription,
      location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
      images: imageUrls,
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
