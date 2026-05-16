const path = require("path");
const express = require("express");
const cors = require("cors");

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
  res.json({ status: "ok", message: "Smart City API running" });
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
