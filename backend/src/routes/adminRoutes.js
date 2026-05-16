const router = require("express").Router();
const auth = require("../middleware/auth");
const { adminLoginIpLimiter } = require("../middleware/rateLimits");
const { adminLogin } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/requireTypes");
const {
  listReports,
  getReport,
  updateReportStatus,
  exportReportsPdf,
  exportSingleReportPdf,
} = require("../controllers/adminReportController");
const { getAnalytics } = require("../controllers/adminAnalyticsController");
const { getAdminSpotlight, upsertAdminSpotlight } = require("../controllers/districtSpotlightController");
const { changePassword } = require("../controllers/adminProfileController");

router.post("/login", adminLoginIpLimiter, adminLogin);
router.patch("/me/password", auth, requireAdmin, changePassword);
router.get("/analytics", auth, requireAdmin, getAnalytics);
router.get("/district-spotlight/:districtId", auth, requireAdmin, getAdminSpotlight);
router.put("/district-spotlight/:districtId", auth, requireAdmin, upsertAdminSpotlight);
router.get("/reports/export.pdf", auth, requireAdmin, exportReportsPdf);
router.get("/reports/:id/export.pdf", auth, requireAdmin, exportSingleReportPdf);
router.get("/reports", auth, requireAdmin, listReports);
router.get("/reports/:id", auth, requireAdmin, getReport);
router.patch("/reports/:id", auth, requireAdmin, updateReportStatus);

module.exports = router;
