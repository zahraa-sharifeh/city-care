const router = require("express").Router();
const { serveUploadByFilename } = require("../services/reportFileStorage");

router.get("/:filename", (req, res, next) => {
  serveUploadByFilename(req, res).catch(next);
});

module.exports = router;
