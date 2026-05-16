const rateLimit = require("express-rate-limit");

/** Shared auth endpoints (register, login, Google, password reset). */
exports.authIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts from this network. Please try again later." },
});

/** Admin login only. */
exports.adminLoginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_ADMIN_LOGIN_MAX || 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

/** Creating reports (multipart, expensive). */
exports.createReportIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_CREATE_REPORT_MAX || 45),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reports submitted from this network this hour. Please try again later." },
});
