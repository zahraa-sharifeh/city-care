const router = require("express").Router();
const { serveUploadById } = require("../services/reportFileStorage");

router.get("/files/:id", (req, res, next) => {
  serveUploadById(req, res).catch(next);
});

module.exports = router;
