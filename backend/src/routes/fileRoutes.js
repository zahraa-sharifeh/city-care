const router = require("express").Router();
const path = require("path");
const {
  openGridFsStream,
  openLegacyDiskStream,
  isObjectId,
} = require("../services/reportFileStorage");

/** Serve report photos from GridFS (new) or legacy disk uploads (old). */
router.get("/files/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (isObjectId(id)) {
      const stream = openGridFsStream(id);
      stream.on("error", () => {
        if (!res.headersSent) res.status(404).json({ message: "File not found" });
      });
      stream.on("file", file => {
        if (file.contentType) res.setHeader("Content-Type", file.contentType);
        res.setHeader("Cache-Control", "public, max-age=86400");
      });
      return stream.pipe(res);
    }

    const legacy = openLegacyDiskStream(id);
    if (!legacy) return res.status(404).json({ message: "File not found" });

    const ext = path.extname(id).toLowerCase();
    const types = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".heic": "image/heic",
      ".heif": "image/heif",
    };
    if (types[ext]) res.setHeader("Content-Type", types[ext]);
    res.setHeader("Cache-Control", "public, max-age=86400");
    legacy.on("error", () => {
      if (!res.headersSent) res.status(404).json({ message: "File not found" });
    });
    return legacy.pipe(res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
});

module.exports = router;
