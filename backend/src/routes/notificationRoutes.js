const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireCitizen } = require("../middleware/requireTypes");
const { listMine, markRead, markAllRead } = require("../controllers/notificationController");

router.get("/", auth, requireCitizen, listMine);
router.patch("/read-all", auth, requireCitizen, markAllRead);
router.patch("/:id/read", auth, requireCitizen, markRead);

module.exports = router;
