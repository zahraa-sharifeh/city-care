const mongoose = require("mongoose");

/** Safe summary for logs / health (no credentials). */
function getMongoTarget() {
  const uri = (process.env.MONGO_URI || "").trim();
  if (!uri) return { host: null, database: null, isLocal: false };
  const isLocal = /127\.0\.0\.1|localhost/.test(uri);
  let host = null;
  let database = null;
  try {
    const normalized = uri.replace(/^mongodb(\+srv)?:\/\//, "https://");
    const u = new URL(normalized);
    host = u.hostname;
    const pathDb = u.pathname.replace(/^\//, "").split("/")[0];
    database = pathDb || "test";
  } catch {
    host = "unknown";
    database = "unknown";
  }
  return { host, database, isLocal };
}

async function connectDB() {
  const target = getMongoTarget();
  if (!process.env.MONGO_URI?.trim()) {
    console.error("❌ MONGO_URI is not set in backend/.env (or Render environment)");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    console.log(`✅ MongoDB connected → host: ${host}, database: ${dbName}`);
    if (target.isLocal) {
      console.warn("⚠️  MONGO_URI points at localhost — data will NOT appear in Atlas. Use your Atlas connection string instead.");
    }
    if (!target.database || target.database === "test") {
      console.warn(
        '⚠️  MONGO_URI has no database name (or uses "test"). Add a name after the host, e.g. ...mongodb.net/smart-city?retryWrites=true&w=majority'
      );
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
module.exports.getMongoTarget = getMongoTarget;
