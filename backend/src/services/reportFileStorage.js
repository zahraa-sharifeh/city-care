const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const BUCKET_NAME = "reportUploads";

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

/** Save an uploaded image buffer to GridFS; returns the file id string. */
async function storeReportFile(buffer, originalName, contentType) {
  const bucket = getBucket();
  const filename = `${Date.now()}-${String(originalName || "photo").replace(/\s+/g, "_")}`;
  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, {
      contentType: contentType || "application/octet-stream",
      metadata: { originalName: String(originalName || "") },
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve(String(stream.id)));
    stream.end(buffer);
  });
}

function openGridFsStream(fileId) {
  return getBucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));
}

/** Try legacy disk file under backend/uploads (old reports). */
function openLegacyDiskStream(filename) {
  const safe = path.basename(filename);
  const full = path.join(UPLOAD_DIR, safe);
  if (!fs.existsSync(full)) return null;
  return fs.createReadStream(full);
}

function storedFilePath(fileId) {
  return `/api/files/${fileId}`;
}

module.exports = {
  storeReportFile,
  openGridFsStream,
  openLegacyDiskStream,
  storedFilePath,
  isObjectId,
};
