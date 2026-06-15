const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const BUCKET_NAME = "reportUploads";

const EXT_MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value) && String(value).length === 24;
}

function safeFilename(name) {
  return path.basename(String(name || "").trim());
}

function mimeFromFilename(filename) {
  return EXT_MIME[path.extname(filename).toLowerCase()] || "application/octet-stream";
}

/** Save buffer to GridFS; returns the stored filename (used in /uploads/<filename> URLs). */
async function storeReportFile(buffer, originalName, contentType) {
  const bucket = getBucket();
  const filename = `${Date.now()}-${safeFilename(originalName || "photo").replace(/\s+/g, "_")}`;
  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, {
      contentType: contentType || mimeFromFilename(filename),
      metadata: { originalName: String(originalName || "") },
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve(filename));
    stream.end(buffer);
  });
}

async function findLatestGridFsFile(filename) {
  const safe = safeFilename(filename);
  if (!safe) return null;
  const bucket = getBucket();
  const files = await bucket.find({ filename: safe }).sort({ uploadDate: -1 }).limit(1).toArray();
  return files[0] || null;
}

function openGridFsStream(fileId) {
  return getBucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));
}

function openLegacyDiskStream(filename) {
  const safe = safeFilename(filename);
  const full = path.join(UPLOAD_DIR, safe);
  if (!fs.existsSync(full)) return null;
  return fs.createReadStream(full);
}

function storedUploadPath(filename) {
  return `/uploads/${safeFilename(filename)}`;
}

function pipeStreamToResponse(res, stream, contentType) {
  if (contentType) {
    res.setHeader("Content-Type", contentType);
  }
  res.setHeader("Cache-Control", "public, max-age=86400");
  stream.on("error", () => {
    if (!res.headersSent) res.status(404).json({ message: "File not found" });
  });
  stream.pipe(res);
}

/** Serve one upload by filename: GridFS first, then legacy disk. */
async function serveUploadByFilename(req, res) {
  const filename = safeFilename(req.params.filename);
  if (!filename) return res.status(400).json({ message: "Invalid filename" });

  const gridFile = await findLatestGridFsFile(filename);
  if (gridFile) {
    const stream = openGridFsStream(gridFile._id);
    return pipeStreamToResponse(res, stream, gridFile.contentType || mimeFromFilename(filename));
  }

  const legacy = openLegacyDiskStream(filename);
  if (legacy) {
    return pipeStreamToResponse(res, legacy, mimeFromFilename(filename));
  }

  return res.status(404).json({ message: "File not found" });
}

async function serveUploadById(req, res) {
  const { id } = req.params;
  if (!isObjectId(id)) {
    res.status(404).json({ message: "File not found" });
    return;
  }

  try {
    const bucket = getBucket();
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).limit(1).toArray();
    if (!files.length) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    const stream = bucket.openDownloadStream(files[0]._id);
    pipeStreamToResponse(res, stream, files[0].contentType || "application/octet-stream");
  } catch {
    if (!res.headersSent) res.status(404).json({ message: "File not found" });
  }
}

module.exports = {
  storeReportFile,
  findLatestGridFsFile,
  openGridFsStream,
  openLegacyDiskStream,
  storedUploadPath,
  serveUploadByFilename,
  serveUploadById,
  isObjectId,
  mimeFromFilename,
};
