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
const upload = multer({ storage: storage }).single("image");

// ADMIN CONTROLLER //
const {
  skillList,
  createSkill,
  editSkill,
  deleteSkill,
  jobList,
  CreateJob,
  EditJob,
  DeleteJob,
  registerCompany,
  editCompany,
  deleteCompany,
  companyList,
  registerUser,
  GetProfile,
  userList,
  editProfile,
  DeleteProfile,
  StudentfilesToValidate,
  validateImages,
  validateVideo,
  validateJobImages,
  createConsultantProfile,
  consultantProfileTeacher,
  consultantProfileStudent,
  registerSchool,
  editSchool,
  deleteSchool,
  validateAppointment,
  getAllAppointments,
  getAllPendingAppointments,
  getAllStudentAppointments,
  getAllCompanyAppointments,
  deleteAppointment,
  addMsg,
} = require("../controllers/admin");

// Middleware Functions //
const { protect, authorize } = require("../middlewares/auth");

// ROUTES

//Skills
router.get("/skill-list", protect, skillList);
router.post("/create-skill", createSkill);
router.put("/edit-skill/:id", [protect, authorize("admin")], editSkill);
router.put("/delete-skill/:id", [protect, authorize("admin")], deleteSkill);

//Jobs
router.get("/job-list", [protect, authorize("admin")], upload, jobList);
router.post("/create-job", [protect, authorize("admin")], upload, CreateJob);
router.put("/edit-job/:id", [protect, authorize("admin")], upload, EditJob);
router.put("/delete-job/:id", [protect, authorize("admin")], DeleteJob);

//Companies
router.get("/company-list", [protect, authorize("admin")], companyList);

router.post(
  "/register-company",
  [protect, authorize("admin")],
  registerCompany
);
router.put("/edit-company/:id", [protect, authorize("admin")], editCompany);
router.put("/delete-company/:id", [protect, authorize("admin")], deleteCompany);

//Users
router.post("/register-user", [protect, authorize("admin")], registerUser);
router.get("/get-profile/:id", [protect, authorize("admin")], GetProfile);
router.get("/user-list", [protect, authorize("admin")], userList);
router.put("/editProfile/:id", [protect, authorize("admin")], editProfile);
router.put("/delete-profile/:id", [protect, authorize("admin")], DeleteProfile);

// VALIDATE PICTURES & VIDEOS
router.get(
  "/filesToValidate",
  [protect, authorize("admin")],
  StudentfilesToValidate
);
router.post("/validate-images", [protect, authorize("admin")], validateImages);
router.post("/validate-videos", [protect, authorize("admin")], validateVideo);
router.post(
  "/validate-job-image",
  [protect, authorize("admin")],
  validateJobImages
);

//Create Consultant Profiles
router.post(
  "/create-consultant-profile",
  [protect, authorize("admin")],
  createConsultantProfile
);
router.get(
  "/consultant-profile-teacher",
  [protect, authorize("admin")],
  consultantProfileTeacher
);
router.get(
  "/consultant-profile-student",
  [protect, authorize("admin")],
  consultantProfileStudent
);

// School //
router.post("/register-school", [protect, authorize("admin")], registerSchool);
router.put("/edit-school/:id", [protect, authorize("admin")], editSchool);
router.put("/delete-school/:id", [protect, authorize("admin")], deleteSchool);

//Appointments list
router.get(
  "/appointment-list",
  [protect, authorize("admin")],
  getAllAppointments
);
//Pending Appointments list
router.get(
  "/pending-appointmnets",
  [protect, authorize("admin")],
  getAllPendingAppointments
);

//GET All Pending Student Appointments
router.get(
  "/student-pending-appointmnets",
  [protect, authorize("admin")],
  getAllStudentAppointments
);

//GET All Pending company Appointments
router.get(
  "/company-pending-appointmnets",
  [protect, authorize("admin")],
  getAllCompanyAppointments
);

//Delete Appointment
router.put(
  "/delete-appointment/:id",
  [protect, authorize("admin")],
  deleteAppointment
);
//Validate Appointments
router.post(
  "/validate-appointmnet",
  [protect, authorize("admin")],
  validateAppointment
);
router.post("/addMsg", addMsg);

module.exports = router;
