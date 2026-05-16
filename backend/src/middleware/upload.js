const fs = require("fs");
const multer = require("multer");
const path = require("path");

// backend/uploads — not cwd-dependent; create if missing (avoids 500 on first upload).
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  },
});

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

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
