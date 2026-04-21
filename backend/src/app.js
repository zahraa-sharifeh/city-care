const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Smart City API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

const commentRoutes = require("./routes/commentRoutes");
app.use("/api", commentRoutes);

const locationRoutes = require("./routes/locationRoutes");
app.use("/api", locationRoutes);

const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", reportRoutes);

module.exports = app;
