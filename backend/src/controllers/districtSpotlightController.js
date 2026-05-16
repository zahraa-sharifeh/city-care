const validator = require("validator");
const District = require("../models/District");
const DistrictSpotlight = require("../models/DistrictSpotlight");
const { parseObjectId } = require("../services/reportAccess");

function adminCanEditDistrict(user, districtObjectId) {
  if (!user || user.type !== "admin") return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "DISTRICT_ADMIN") {
    const uid = parseObjectId(user.districtId);
    if (!uid || !districtObjectId) return false;
    return String(uid) === String(districtObjectId);
  }
  return false;
}

async function loadDistrict(districtParam) {
  const id = parseObjectId(districtParam);
  if (!id) return null;
  const district = await District.findById(id).populate("governorateId", "name").lean();
  if (!district) return null;
  return { id, district };
}

function normalizeEvents(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const title = String(item.title || "").trim();
    if (!title) continue;
    const summary = String(item.summary || "").trim().slice(0, 2000);
    const venue = String(item.venue || "").trim().slice(0, 300);
    let url = String(item.url || "").trim().slice(0, 2000);
    if (url && !validator.isURL(url, { require_protocol: true, require_valid_protocol: true })) {
      url = "";
    }
    let startsAt = null;
    if (item.startsAt) {
      const d = new Date(item.startsAt);
      if (!Number.isNaN(d.getTime())) startsAt = d;
    }
    out.push({ title: title.slice(0, 300), summary, venue, url, startsAt });
    if (out.length >= 25) break;
  }
  return out;
}

async function buildResponse(districtParam) {
  const bundle = await loadDistrict(districtParam);
  if (!bundle) return null;
  const spotlight = await DistrictSpotlight.findOne({ districtId: bundle.id }).lean();
  return {
    districtId: bundle.district._id,
    districtName: bundle.district.name,
    governorateName: bundle.district.governorateId?.name || "",
    essay: spotlight?.essay ?? "",
    heritageInfo: spotlight?.heritageInfo ?? "",
    events: (spotlight?.events || []).map(e => ({
      _id: e._id,
      title: e.title,
      summary: e.summary,
      startsAt: e.startsAt,
      venue: e.venue,
      url: e.url,
    })),
    updatedAt: spotlight?.updatedAt ?? null,
  };
}

exports.getPublicSpotlight = async (req, res) => {
  try {
    const payload = await buildResponse(req.params.districtId);
    if (!payload) return res.status(404).json({ message: "District not found" });
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAdminSpotlight = async (req, res) => {
  try {
    const bundle = await loadDistrict(req.params.districtId);
    if (!bundle) return res.status(404).json({ message: "District not found" });
    if (!adminCanEditDistrict(req.user, bundle.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const payload = await buildResponse(req.params.districtId);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.upsertAdminSpotlight = async (req, res) => {
  try {
    const bundle = await loadDistrict(req.params.districtId);
    if (!bundle) return res.status(404).json({ message: "District not found" });
    if (!adminCanEditDistrict(req.user, bundle.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const essay = String(req.body?.essay ?? "").trim().slice(0, 20000);
    const heritageInfo = String(req.body?.heritageInfo ?? "").trim().slice(0, 20000);
    const events = normalizeEvents(req.body?.events);

    const adminId = parseObjectId(req.user.id);
    const doc = await DistrictSpotlight.findOneAndUpdate(
      { districtId: bundle.id },
      {
        $set: {
          essay,
          heritageInfo,
          events,
          lastUpdatedBy: adminId,
        },
        $setOnInsert: { districtId: bundle.id },
      },
      { new: true, upsert: true, runValidators: true }
    );

    const payload = await buildResponse(req.params.districtId);
    res.json({ ...payload, savedAt: doc.updatedAt });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
