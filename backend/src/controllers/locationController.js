const Governorate = require("../models/Governorate");
const District = require("../models/District");
const { resolveAdminFromLatLng, isRoughlyInLebanon } = require("../services/reverseAdminLookup");
const { nominatimSearch } = require("../services/nominatimClient");

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

// GET /api/location/from-coordinates?lat=&lng=
exports.fromCoordinates = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "lat and lng query parameters must be valid numbers" });
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }
    if (!isRoughlyInLebanon(lat, lng)) {
      return res.status(400).json({
        message: "These coordinates appear to be outside Lebanon. Pick governorate and district manually.",
      });
    }

    const resolved = await resolveAdminFromLatLng(lat, lng);
    if (!resolved) {
      return res.status(404).json({
        message:
          "Could not match this GPS point to a governorate and district in our directory. Adjust the pin or choose them manually.",
      });
    }

    res.json({
      governorateId: String(resolved.governorateId),
      districtId: String(resolved.districtId),
      governorateName: resolved.governorateName,
      districtName: resolved.districtName,
      displayName: resolved.displayName,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/location/search?q=...  (proxy to Nominatim; browsers should not call OSM directly)
exports.searchPlaces = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(400).json({ message: "Enter at least 2 characters to search." });
    }
    if (q.length > 240) {
      return res.status(400).json({ message: "Search text is too long." });
    }

    const items = await nominatimSearch(q, { limit: 5 });
    const out = items.map(row => ({
      place_id: row.place_id,
      osm_id: row.osm_id,
      lat: row.lat,
      lon: row.lon,
      display_name: row.display_name,
    }));
    res.json(out);
  } catch (err) {
    const msg = err.name === "AbortError" ? "Search timed out. Try again." : err.message || "Search failed";
    res.status(502).json({ message: msg });
  }
};
