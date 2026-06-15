const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { getMongoTarget } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminDepartmentRoutes = require("./routes/adminDepartmentRoutes");
const districtSpotlightRoutes = require("./routes/districtSpotlightRoutes");

const app = express();

// Render / reverse proxies — correct protocol & host for upload URLs
app.set("trust proxy", 1);

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
    uploads: "gridfs",
    mongo: {
      connected,
      host: connected ? mongoose.connection.host : configured.host,
      database: connected ? mongoose.connection.name : configured.database,
      isLocal: configured.isLocal,
    },
  });
});

app.use("/api/auth", authRoutes);
const uploadRoutes = require("./routes/uploadRoutes");
app.use("/uploads", uploadRoutes);
const fileRoutes = require("./routes/fileRoutes");
app.use("/api", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/departments", adminDepartmentRoutes);
app.use("/api", districtSpotlightRoutes);

const commentRoutes = require("./routes/commentRoutes");
app.use("/api", commentRoutes);

const locationRoutes = require("./routes/locationRoutes");
app.use("/api", locationRoutes);

const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", reportRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

module.exports = app;
