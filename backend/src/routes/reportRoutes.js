const router = require("express").Router();
const auth = require("../middleware/auth");
const optionalAuth = auth.optionalAuth;
const upload = require("../middleware/upload");
const { createReportIpLimiter } = require("../middleware/rateLimits");
const { requireCitizen } = require("../middleware/requireTypes");
const {
  createReport,
  listMine,
  getMineById,
  getNearbySimilar,
  listPublicReports,
  getPublicReportById,
} = require("../controllers/reportController");

router.post("/", createReportIpLimiter, auth, requireCitizen, upload.array("images", 5), createReport);
router.get("/mine", auth, requireCitizen, listMine);
router.get("/nearby-similar", auth, requireCitizen, getNearbySimilar);
router.get("/public", listPublicReports);
router.get("/public/:id", optionalAuth, getPublicReportById);
router.get("/:id", auth, requireCitizen, getMineById);

module.exports = router;
