const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);


// Health check (quick test)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running ✅" });
});

module.exports = app;
