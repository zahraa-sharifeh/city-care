const router = require("express").Router();
const auth = require("../middleware/auth");
const { adminLogin } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/requireTypes");
const { listReports, getReport, updateReportStatus } = require("../controllers/adminReportController");
const { changePassword } = require("../controllers/adminProfileController");

router.post("/login", adminLogin);
router.patch("/me/password", auth, requireAdmin, changePassword);
router.get("/reports", auth, requireAdmin, listReports);
router.get("/reports/:id", auth, requireAdmin, getReport);
router.patch("/reports/:id", auth, requireAdmin, updateReportStatus);

module.exports = router;
