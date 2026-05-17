const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { getMongoTarget } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminDepartmentRoutes = require("./routes/adminDepartmentRoutes");
const districtSpotlightRoutes = require("./routes/districtSpotlightRoutes");

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map(s => s.trim())
      .filter(Boolean)
  : null;
app.use(
  cors(
    corsOrigins?.length
      ? {
          origin: corsOrigins,
          credentials: true,
        }
      : undefined
  )
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  const configured = getMongoTarget();
  const connected = mongoose.connection.readyState === 1;
  res.json({
    status: "ok",
    message: "Smart City API running",
    googleSignIn: Boolean((process.env.GOOGLE_CLIENT_ID || "").trim()),
    mongo: {
      connected,
      host: connected ? mongoose.connection.host : configured.host,
      database: connected ? mongoose.connection.name : configured.database,
      isLocal: configured.isLocal,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/departments", adminDepartmentRoutes);
app.use("/api", districtSpotlightRoutes);
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

const commentRoutes = require("./routes/commentRoutes");
app.use("/api", commentRoutes);

const locationRoutes = require("./routes/locationRoutes");
app.use("/api", locationRoutes);

const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", reportRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

module.exports = app;
