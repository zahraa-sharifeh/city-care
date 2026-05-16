const router = require("express").Router();
const auth = require("../middleware/auth");
const { authIpLimiter } = require("../middleware/rateLimits");
const { requireCitizen } = require("../middleware/requireTypes");
const { register, login, googleCitizen, forgotPassword, resetPassword, changePassword, getMe, updateMe } = require("../controllers/authController");

router.post("/register", authIpLimiter, register);
router.post("/login", authIpLimiter, login);
router.post("/google", authIpLimiter, googleCitizen);
router.post("/forgot-password", authIpLimiter, forgotPassword);
router.post("/reset-password", authIpLimiter, resetPassword);
router.get("/me", auth, requireCitizen, getMe);
router.patch("/me", auth, requireCitizen, updateMe);
router.patch("/me/password", auth, requireCitizen, changePassword);

module.exports = router;
