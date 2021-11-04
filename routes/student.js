const express = require("express");

const router = express.Router();
const { upload } = require("../middlewares/multer");

// MULTER Configuaration //

// Controller Functions //

const {
  register,
  edit,
  GetStudentProfile,
  DeleteProfile,
  bookCoachingAppointment,
  searchForJob,
  GetUser,
  DeleteSchool,
  DeleteProfessionalInfo,
  GetSkills,
  validateAppointment,
} = require("../controllers/student");
//middleware functions

const { protect, validateType } = require("../middlewares/auth");

// Routes for Students //
router.get("/getStudentProfile/:id", protect, GetStudentProfile);
router.post("/get_skills", protect, GetSkills);

router.post("/get-info", [protect, validateType("student")], GetUser);

router.post("/add-info", [protect, validateType("student")], upload, register);
// router.put("/edit-info/:id", [protect, validateType("student")], upload, edit);
// update student profile
router.put("/edit-info", [protect, validateType("student")], upload, edit);

router.delete("/delete-profile", protect, DeleteProfile);
router.delete(
  "/delete-school/:id",
  [protect, validateType("student")],
  DeleteSchool
);
router.delete(
  "/delete-professional-info/:id",
  [protect, validateType("student")],
  DeleteProfessionalInfo
);

// Book Coaching Appointment //
router.post(
  "/book-appointment",
  [protect, validateType("student")],
  bookCoachingAppointment
);
// Book Coaching Appointment //
router.post(
  "/validateAppointment/:id",
  [protect, validateType("student")],
  validateAppointment
);

// Search for Jobs //
router.post("/search-job", [protect, validateType("student")], searchForJob);
module.exports = router;
