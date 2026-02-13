const router = require("express").Router();
const auth = require("../middleware/auth");
const { addComment, getComments } = require("../controllers/commentController");

router.get("/reports/:id/comments", auth, getComments);
router.post("/reports/:id/comments", auth, addComment);

module.exports = router;
