const router = require("express").Router();
const { getPublicSpotlight } = require("../controllers/districtSpotlightController");

router.get("/districts/:districtId/spotlight", getPublicSpotlight);

module.exports = router;
