const router = require("express").Router();
const { getGovernorates, getDistricts } = require("../controllers/locationController");

router.get("/governorates", getGovernorates);
router.get("/districts", getDistricts);

module.exports = router;
