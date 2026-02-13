require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const Governorate = require("./src/models/Governorate");
const District = require("./src/models/District");

const DATA = [
  { name: "Beirut", districts: ["Beirut"] },

  {
    name: "North",
    districts: ["Tripoli", "Zgharta", "Batroun", "Bcharre", "Koura", "Minieh - Danniyeh"],
  },

  {
    name: "Mount Lebanon",
    districts: ["Baabda", "Matn", "Kesrouane", "Byblos", "El Chouf", "Aalay"],
  },

  { name: "Akkar", districts: ["Akkar"] },

  { name: "South", districts: ["Saida", "Sour", "Jezzine"] },

  { name: "Nabatiyeh", districts: ["Bint Jbeil", "Marjayoun", "Hasbaiyya", "Nabatiyeh"] },

  { name: "Beqaa", districts: ["Western Bekaa", "Zahle", "Rachaiya"] },

  { name: "Baalbek-Hermel", districts: ["Baalbek", "Hermel"] },
];

async function seed() {
  await connectDB();

  // Upsert governorates + districts (safe to run multiple times)
  for (const gov of DATA) {
    const governorate = await Governorate.findOneAndUpdate(
      { name: gov.name },
      { name: gov.name },
      { upsert: true, new: true }
    );

    for (const d of gov.districts) {
      await District.findOneAndUpdate(
        { name: d, governorateId: governorate._id },
        { name: d, governorateId: governorate._id },
        { upsert: true, new: true }
      );
    }
  }

  const govCount = await Governorate.countDocuments();
  const districtCount = await District.countDocuments();

  console.log("✅ Seed done");
  console.log("Governorates:", govCount);
  console.log("Districts:", districtCount);

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("❌ Seed failed:", err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
