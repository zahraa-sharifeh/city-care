const router = require("express").Router();
const auth = require("../middleware/auth");
const { getGovernorates, getDistricts } = require("../controllers/locationController");

// You can remove auth if you want public access. I keep it protected for now.
router.get("/governorates", auth, getGovernorates);
router.get("/districts", auth, getDistricts);

// const locationRoutes = require("./routes/locationRoutes");
// app.use("/api", locationRoutes);

module.exports = router;
