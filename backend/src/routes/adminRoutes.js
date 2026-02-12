const router = require("express").Router();
const { adminLogin } = require("../controllers/authController");

router.post("/login", adminLogin);

module.exports = router;
