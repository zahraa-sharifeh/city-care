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
  const ok = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  cb(ok ? null : new Error("Only images allowed"), ok);
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
