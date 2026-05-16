const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireTypes");
const { listDepartments, createDepartment } = require("../controllers/adminDepartmentController");

router.get("/", auth, requireAdmin, listDepartments);
router.post("/", auth, requireAdmin, createDepartment);

module.exports = router;
