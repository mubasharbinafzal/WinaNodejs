const express = require("express");
const multer = require("multer");
const router = express.Router();
const { upload } = require("../middlewares/multer");

// MULTER Configuaration //

// Controller Functions //

const {
  CreateJob,
  EditJob,
  DeleteJob,
  GetJob,
  GetJobs,
  OfferDecisionByStudent,
  OfferDecisionByCompany,
  GetStudentAppliedJobs,
  GetStudentRejectedJobs,
  GetAllStudentAppliedJobs,
  GetCompanyAppliedJobs,
  OffersRecievedDecisionByStudent,
  OffersRecievedDecisionByCompany,
  CancelOfferDecisionByStudent,
  GetAllCompanyAppliedJobs,
  CancelOfferDecisionByCompany,
  GetStudentAppliedSuccessJobs,
} = require("../controllers/job");

//middleware functions

const { protect, validateType } = require("../middlewares/auth");

// Routes for Jobs //

// CREATE Job
router.post(
  "/create-job",
  [protect, validateType("company")],
  upload,
  CreateJob
);

// EDIT Job
router.put(
  "/edit-job/:id",
  [protect, validateType("company")],
  upload,
  EditJob
);
// get single Job
router.get("/get-job/:id", protect, GetJob);
router.get("/get-jobs", [protect, validateType("company")], GetJobs);
//get all offers requested by student
router.get(
  "/GetStudentAppliedJobs",
  [protect, validateType("student")],
  GetStudentAppliedJobs
);
router.get(
  "/GetStudentAppliedSuccessJobs",
  [protect, validateType("student")],
  GetStudentAppliedSuccessJobs
);
//get all offers rejected by student
router.get(
  "/GetStudentRejectedJobs",
  [protect, validateType("student")],
  GetStudentRejectedJobs
);
//get all offers requested by company and recieved by specific student
router.get(
  "/GetCompanyAppliedJobs",
  [protect, validateType("student")],
  GetCompanyAppliedJobs
);
//get all offers requested by student and recieved by specific company
router.get(
  "/GetAllStudentAppliedJobs/:id",
  [protect, validateType("company")],
  GetAllStudentAppliedJobs
);
router.get(
  "/GetAllCompanyAppliedJobs/:id",
  [protect, validateType("company")],
  GetAllCompanyAppliedJobs
);
// DELETE Job
router.put("/delete-job/:id", [protect, validateType("company")], DeleteJob);

// student Offers********************************
// offer decision by student
router.post(
  "/offer-decision-by-student/:id",
  [protect, validateType("student")],
  upload,
  OfferDecisionByStudent
);
// cancel offer decision by student
router.post(
  "/CancelOfferDecisionByStudent/:id",
  [protect, validateType("student")],
  upload,
  CancelOfferDecisionByStudent
);
// cancel offer decision by company
router.post(
  "/CancelOfferDecisionByCompany/:id",
  [protect, validateType("company")],
  upload,
  CancelOfferDecisionByCompany
);
router.post(
  "/OffersRecievedDecisionByStudent/:id",
  [protect, validateType("student")],
  upload,
  OffersRecievedDecisionByStudent
);
router.post(
  "/OffersRecievedDecisionByCompany/:id",
  [protect, validateType("company")],
  upload,
  OffersRecievedDecisionByCompany
);
// *****

// offer decision by company
router.post(
  "/offer-decision-by-company/:id",
  [protect, validateType("company")],
  upload,
  OfferDecisionByCompany
);
// VIEW Single Job
// router.put("/view-job/:id", [protect, validateType("company")], getSingleJob);

module.exports = router;
