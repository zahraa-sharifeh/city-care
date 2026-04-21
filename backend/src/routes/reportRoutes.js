const router = require("express").Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { requireCitizen } = require("../middleware/requireTypes");
const { createReport, listMine, getMineById } = require("../controllers/reportController");

router.post("/", auth, requireCitizen, upload.array("images", 5), createReport);
router.get("/mine", auth, requireCitizen, listMine);
router.get("/:id", auth, requireCitizen, getMineById);

module.exports = router;
