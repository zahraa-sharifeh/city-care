const router = require("express").Router();
const { getGovernorates, getDistricts, fromCoordinates, searchPlaces } = require("../controllers/locationController");
const { getDistrictDashboard } = require("../controllers/reportController");

router.get("/governorates", getGovernorates);
router.get("/districts", getDistricts);
router.get("/location/search", searchPlaces);
router.get("/location/from-coordinates", fromCoordinates);
router.get("/districts/:districtId/dashboard", getDistrictDashboard);

module.exports = router;
