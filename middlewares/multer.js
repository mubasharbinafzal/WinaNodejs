const multer = require("multer");

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  destination: function (req, file, cb) {
    cb(null, "views/uploads");
  },
});

exports.upload = multer({ storage: storage }).fields([
  {
    name: "video",
    maxCount: 1,
  },
  {
    name: "image",
    maxCount: 1,
  },
  {
    name: "photo",
    maxCount: 1,
  },
  {
    name: "school_image",
    maxCount: 1,
  },
  {
    name: "resume",
    maxCount: 1,
  },
]);
