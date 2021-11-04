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

const upload = multer({ storage: storage });

// Controller Functions //
const {
  registerUser,
  verifyEmail,
  verifyEmailProcess,
  login,
  logout,
} = require("../controllers/auth");

//middleware functions

const { protect, authorize, dashboard } = require("../middlewares/auth");

//Register USER routes

router.post("/register", registerUser);

router.post("/email-verfication", verifyEmail);
router.post("/verify-email/:token", verifyEmailProcess);

//LOGIN Route

router.post("/login", login);

//LOGOUT Route
router.post("/logout", logout);

module.exports = router;
