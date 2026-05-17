/**
 * Fix common MongoDB Compass / JSON import issues so reports show in the app.
 *
 * - Converts string userId, governorateId, districtId, departmentId to ObjectId
 * - Ensures location is GeoJSON Point with [lng, lat]
 * - Ensures duplicateReview object exists
 * - Ensures images is a non-empty array (placeholder if missing)
 *
 * Usage (uses MONGO_URI from backend/.env):
 *   node scripts/fixImportedRefs.js
 *   node scripts/fixImportedRefs.js --dry-run
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const DRY_RUN = process.argv.includes("--dry-run");

function toObjectId(value) {
  if (value == null || value === "") return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "object" && value.$oid) return new mongoose.Types.ObjectId(value.$oid);
  const s = String(value);
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

function normalizeLocation(loc) {
  if (!loc) return null;
  let coords = loc.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { type: "Point", coordinates: [lng, lat] };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  console.log("Database:", dbName, DRY_RUN ? "(dry run)" : "");

  const reportsCol = db.collection("reports");
  const count = await reportsCol.countDocuments();
  console.log("reports count:", count);

  if (count === 0) {
    console.log("No documents in 'reports' collection. Check database name in MONGO_URI and collection name.");
    await mongoose.disconnect();
    return;
  }

  const cursor = reportsCol.find({});
  let updated = 0;
  let skipped = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const set = {};
    const unset = {};

    const userId = toObjectId(doc.userId);
    const governorateId = toObjectId(doc.governorateId);
    const districtId = toObjectId(doc.districtId);
    const departmentId = doc.departmentId ? toObjectId(doc.departmentId) : null;

    if (userId && String(userId) !== String(doc.userId)) set.userId = userId;
    if (governorateId && String(governorateId) !== String(doc.governorateId)) set.governorateId = governorateId;
    if (districtId && String(districtId) !== String(doc.districtId)) set.districtId = districtId;
    if (doc.departmentId && departmentId) set.departmentId = departmentId;

    const loc = normalizeLocation(doc.location);
    if (loc) set.location = loc;

    if (!doc.status) set.status = "PENDING";
    if (!doc.priority) set.priority = "MEDIUM";
    if (!doc.duplicateReview) {
      set.duplicateReview = { status: "PENDING_REVIEW", primaryReportId: null };
    }

    if (!Array.isArray(doc.images) || doc.images.length === 0) {
      set.images = ["/uploads/placeholder-import.jpg"];
      console.warn("Report", doc._id, "had no images — added placeholder path (upload a real file or fix URLs)");
    }

    if (Object.keys(set).length === 0) {
      skipped += 1;
      continue;
    }

    if (!DRY_RUN) {
      await reportsCol.updateOne({ _id: doc._id }, { $set: set });
    }
    updated += 1;
  }

  console.log("Updated:", updated, "Unchanged:", skipped);

  // Summary for admin visibility
  const byDistrict = await reportsCol
    .aggregate([{ $group: { _id: "$districtId", n: { $sum: 1 } } }, { $sort: { n: -1 } }])
    .toArray();
  console.log("\nReports per districtId (first 5):");
  byDistrict.slice(0, 5).forEach(row => console.log(" ", row._id, "→", row.n));

  const admins = await db.collection("admins").find({}).project({ email: 1, role: 1, districtId: 1 }).toArray();
  console.log("\nAdmins (check districtId matches your reports):");
  admins.slice(0, 8).forEach(a => console.log(" ", a.email, a.role, "districtId:", a.districtId));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
