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

module.exports = app;
