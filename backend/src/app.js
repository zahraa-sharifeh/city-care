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
app.use("/uploads", require("express").static("uploads"));

const commentRoutes = require("./routes/commentRoutes");
app.use("/api", commentRoutes);

const locationRoutes = require("./routes/locationRoutes");
app.use("/api", locationRoutes);

const reportRoutes = require("./routes/reportRoutes");
app.use("/api", reportRoutes);


module.exports = app;
