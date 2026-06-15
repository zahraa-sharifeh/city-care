const Report = require("../models/Report");
const District = require("../models/District");
const { citizenOwnsReport, parseObjectId } = require("../services/reportAccess");
const { findDuplicateCandidates, pickAutoDuplicatePrimary } = require("../services/duplicateDetection");
const { storeReportFile, storedFilePath } = require("../services/reportFileStorage");
const { normalizeReportImages, normalizeReportsList } = require("../utils/uploadUrls");

const populateReport = [
  { path: "governorateId", select: "name" },
  { path: "districtId", select: "name" },
];

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
  return R * c;
}

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

    const imageUrls = [];
    for (const file of files) {
      const fileId = await storeReportFile(file.buffer, file.originalname, file.mimetype);
      imageUrls.push(storedFilePath(fileId));
    }

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

    try {
      const candidates = await findDuplicateCandidates(created, {});
      const primary = pickAutoDuplicatePrimary(candidates);
      if (primary) {
        created.duplicateReview = { status: "CONFIRMED_DUPLICATE", primaryReportId: primary._id };
        await created.save();
        await Report.findOneAndUpdate(
          {
            _id: primary._id,
            "duplicateReview.status": "CONFIRMED_DUPLICATE",
            "duplicateReview.primaryReportId": created._id,
          },
          {
            $set: {
              "duplicateReview.status": "PENDING_REVIEW",
              "duplicateReview.primaryReportId": null,
            },
          }
        );
      }
    } catch (dupErr) {
      console.error("Auto duplicate detection failed:", dupErr.message);
    }

    const report = await Report.findById(created._id).populate(populateReport);
    res.status(201).json(normalizeReportImages(report, req));
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
    const openFilter = { ...filter, status: { $in: ["PENDING", "IN_PROGRESS"] } };
    const [items, total, openCount] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(populateReport)
        .lean(),
      Report.countDocuments(filter),
      Report.countDocuments(openFilter),
    ]);

    res.json({
      items: normalizeReportsList(items, req),
      total,
      openCount,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    });
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
    res.json(normalizeReportImages(report, req));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getNearbySimilar = async (req, res) => {
  try {
    const districtId = parseObjectId(req.query.districtId);
    const category = String(req.query.category || "").trim();
    const lat = toNumber(req.query.lat);
    const lng = toNumber(req.query.lng);
    const radiusMeters = Math.min(1200, Math.max(100, parseInt(req.query.radiusMeters, 10) || 500));
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const excludeId = parseObjectId(req.query.excludeId);

    if (!districtId || !category || lat === null || lng === null) {
      return res.status(400).json({ message: "districtId, category, lat and lng are required" });
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const filter = {
      districtId,
      category,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusMeters,
        },
      },
    };
    if (excludeId) filter._id = { $ne: excludeId };

    const items = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("category status locationDescription location createdAt")
      .lean();

    const origin = { lat, lng };
    const nearby = items
      .map(item => {
        const coords = item?.location?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        const point = { lat: Number(coords[1]), lng: Number(coords[0]) };
        if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;
        return {
          _id: item._id,
          category: item.category,
          status: item.status,
          locationDescription: item.locationDescription,
          createdAt: item.createdAt,
          distanceMeters: Math.round(haversineMeters(origin, point)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    res.json({ items: nearby, radiusMeters });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getDistrictDashboard = async (req, res) => {
  try {
    const districtId = parseObjectId(req.params.districtId);
    if (!districtId) return res.status(400).json({ message: "Invalid districtId" });

    const district = await District.findById(districtId).populate("governorateId", "name").lean();
    if (!district) return res.status(404).json({ message: "District not found" });

    const filter = { districtId };
    const total = await Report.countDocuments(filter);

    const statusAgg = await Report.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const status = statusAgg.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});

    const topCategories = await Report.aggregate([
      { $match: filter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const resolutionAgg = await Report.aggregate([
      { $match: { ...filter, status: "RESOLVED" } },
      {
        $project: {
          resolutionMs: { $subtract: ["$updatedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionMs: { $avg: "$resolutionMs" },
          resolvedCount: { $sum: 1 },
        },
      },
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCreated = await Report.countDocuments({ ...filter, createdAt: { $gte: thirtyDaysAgo } });

    const avgResolutionDays = resolutionAgg[0]?.avgResolutionMs
      ? Number((resolutionAgg[0].avgResolutionMs / (1000 * 60 * 60 * 24)).toFixed(1))
      : null;

    res.json({
      districtId: district._id,
      districtName: district.name,
      governorateName: district.governorateId?.name || "",
      totalReports: total,
      openReports: (status.PENDING || 0) + (status.IN_PROGRESS || 0),
      pendingReports: status.PENDING || 0,
      inProgressReports: status.IN_PROGRESS || 0,
      resolvedReports: status.RESOLVED || 0,
      rejectedReports: status.REJECTED || 0,
      avgResolutionDays,
      recentCreated30Days: recentCreated,
      topCategories: topCategories.map(item => ({ key: item._id || "Other", count: item.count })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const publicReportSelect =
  "-userId -departmentId -duplicateReview -priority";

/** Public discovery list (no auth). Open reports only (PENDING / IN_PROGRESS). Optional filters: governorateId, districtId, category, sort. */
exports.listPublicReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(400, Math.max(1, parseInt(req.query.limit, 10) || 24));
    const skip = (page - 1) * limit;

    const filter = {
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    };

    const dId = parseObjectId(req.query.districtId);
    const gId = parseObjectId(req.query.governorateId);
    if (dId) filter.districtId = dId;
    else if (gId) filter.governorateId = gId;

    const category = String(req.query.category || "").trim();
    if (category) filter.category = category;

    const sortOldest = String(req.query.sort || "").toLowerCase() === "oldest";
    const sort = sortOldest ? { createdAt: 1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Report.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(publicReportSelect)
        .populate(populateReport)
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json({
      items: normalizeReportsList(items, req),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/** Single report for public read (no submitter identity). Adds `isMine` when a citizen JWT matches the author. */
exports.getPublicReportById = async (req, res) => {
  try {
    const id = parseObjectId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid report id" });

    const report = await Report.findById(id).populate(populateReport).lean();
    if (!report) return res.status(404).json({ message: "Report not found" });

    const viewer = req.user;
    const isMine =
      viewer &&
      viewer.type === "citizen" &&
      report.userId &&
      String(report.userId) === String(viewer.id);

    const { userId, departmentId, duplicateReview, priority, ...publicFields } = report;
    res.json({ ...normalizeReportImages(publicFields, req), isMine: Boolean(isMine) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
