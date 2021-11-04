const express = require("express");
const multer = require("multer");
const router = express.Router();

// MULTER Configuaration //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "views/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Controller Functions //
const {
  register,
  editCompany,
  deleteCompany,
  bookCoachingAppointment,
  searchForStudents,
} = require("../controllers/company");

//middleware functions
const { protect, validateType } = require("../middlewares/auth");

router.post("/register-company", register);

router.put("/edit-company", [protect, validateType("company")], editCompany);

router.delete(
  "/delete-company",
  [protect, validateType("company")],
  deleteCompany
);

// Book Coaching Appointment //
router.post(
  "/book-coaching-appointment/:id",
  [protect, validateType("company")],
  bookCoachingAppointment
);

// Search for Students //
router.post(
  "/search-students/:id",
  [protect, validateType("company")],
  searchForStudents
);

module.exports = router;
