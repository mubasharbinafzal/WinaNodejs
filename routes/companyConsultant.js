const express = require("express");
const multer = require("multer");
const router = express.Router();

// MULTER Configuaration //

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  destination: function (req, file, cb) {
    cb(null, "views/uploads");
  },
});

const upload = multer({ storage: storage }).fields([
  {
    name: "video",
    maxCount: 1,
  },
  {
    name: "image",
    maxCount: 1,
  },
  {
    name: "resume",
    maxCount: 1,
  },
]);

// Controller Functions //

const { editInfo } = require("../controllers/companyConsultant");

//middleware functions

const { protect, validateType } = require("../middlewares/auth");

router.put(
  "/edit-info",
  [protect, validateType("companyConsultant")],
  editInfo
);

module.exports = router;
