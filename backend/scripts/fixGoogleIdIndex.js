/**
 * Fixes E11000 duplicate key on users.googleId when many rows have googleId: null.
 * Sparse unique indexes only skip missing fields, not explicit null.
 *
 * Usage: npm run fix:google-id
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

async function main() {
  const uri = (process.env.MONGO_URI || "").trim();
  if (!uri) {
    console.error("MONGO_URI is not set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const users = mongoose.connection.collection("users");
  const dbName = mongoose.connection.name;
  console.log(`Connected to database: ${dbName}`);

  const unset = await users.updateMany(
    { $or: [{ googleId: null }, { googleId: "" }] },
    { $unset: { googleId: "" } }
  );
  console.log(`Unset googleId on ${unset.modifiedCount} user(s)`);

  try {
    await users.dropIndex("googleId_1");
    console.log("Dropped index googleId_1");
  } catch (err) {
    console.log(`dropIndex googleId_1: ${err.message}`);
  }

  await users.createIndex({ googleId: 1 }, { unique: true, sparse: true });
  console.log("Created sparse unique index on googleId");

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
