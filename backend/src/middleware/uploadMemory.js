const multer = require("multer");
const path = require("path");

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".gif"];
  const allowedMime = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/gif",
  ];
  const ok = allowedExt.includes(ext) || allowedMime.includes((file.mimetype || "").toLowerCase());
  cb(ok ? null : new Error("Only image files are allowed (jpg, jpeg, png, webp, heic, heif, gif)"), ok);
}

module.exports = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
