const router = require("express").Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { createReport } = require("../controllers/reportController");

router.post("/", auth, upload.array("images", 5), createReport); // max 5 images

module.exports = router;
