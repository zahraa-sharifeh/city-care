/**
 * Seed admins: one DISTRICT_ADMIN per district in the DB, plus optional EXTRA_ADMINS (e.g. super admin).
 *
 * Run after locations exist:
 *   node seedLebanonLocations.js
 *   node seedAdmins.js
 *
 * Password for all seeded rows: SEED_ADMIN_PASSWORD env or default below.
 * Skips any email that already exists.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
// Register Governorate so District.populate("governorateId") can resolve the ref.
require("./src/models/Governorate");
const District = require("./src/models/District");
const Admin = require("./src/models/Admin");

const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

/** Optional fixed accounts (e.g. one super admin). Same password as DEFAULT_PASSWORD unless you set password per row. */
const EXTRA_ADMINS = [
  {
    fullName: "Super Admin",
    email: "superadmin@local.test",
    role: "SUPER_ADMIN",
    districtId: null,
  },
];

function slugPart(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "x";
}

function emailForDistrict(governorateName, districtName) {
  return `admin.${slugPart(governorateName)}.${slugPart(districtName)}@local.test`;
}

async function createIfMissing({ fullName, email, password, role, districtId }) {
  const normalized = email.toLowerCase().trim();
  const existing = await Admin.findOne({ email: normalized });
  if (existing) {
    console.log("Skip (exists):", normalized);
    return "skipped";
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({
    fullName: fullName.trim(),
    email: normalized,
    passwordHash,
    role,
    districtId: districtId || null,
  });
  console.log("✅ Created:", normalized, role);
  return "created";
}

async function seed() {
  await connectDB();

  const password = DEFAULT_PASSWORD;
  let created = 0;
  let skipped = 0;

  for (const row of EXTRA_ADMINS) {
    const r = await createIfMissing({
      fullName: row.fullName,
      email: row.email,
      password: row.password || password,
      role: row.role,
      districtId: row.districtId,
    });
    if (r === "created") created += 1;
    else skipped += 1;
  }

  const districts = await District.find().populate("governorateId", "name").sort({ name: 1 });

  if (districts.length === 0) {
    throw new Error("No districts in DB — run node seedLebanonLocations.js first");
  }

  for (const d of districts) {
    const govName = d.governorateId?.name;
    if (!govName) {
      console.warn("Skip district (missing governorate):", d.name, d._id);
      skipped += 1;
      continue;
    }

    const email = emailForDistrict(govName, d.name);
    const fullName = `${d.name} district admin`;

    const r = await createIfMissing({
      fullName,
      email,
      password,
      role: "DISTRICT_ADMIN",
      districtId: d._id,
    });
    if (r === "created") created += 1;
    else skipped += 1;
  }

  console.log("Done. Districts processed:", districts.length, "Created:", created, "Skipped:", skipped);
  console.log("");
  console.log("--- Admin login (use on admin-web) ---");
  console.log("Super admin email:", EXTRA_ADMINS[0].email);
  console.log("Password:", password, "(from SEED_ADMIN_PASSWORD or default ChangeMe123!)");
  console.log("District admins: admin.<governorate-slug>.<district-slug>@local.test — same password.");
  await mongoose.disconnect();
}

seed().catch(async err => {
  console.error("❌ Seed failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
