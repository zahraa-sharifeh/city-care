const router = require("express").Router();
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const { requireCitizen } = require("../middleware/requireTypes");
const { addComment, getComments } = require("../controllers/commentController");
const { getLikeSummary, toggleLike } = require("../controllers/reportLikeController");

router.get("/reports/:id/comments", auth, getComments);
router.post("/reports/:id/comments", auth, requireCitizen, addComment);
router.get("/reports/:id/likes", optionalAuth, getLikeSummary);
router.post("/reports/:id/likes", auth, requireCitizen, toggleLike);

module.exports = router;
