const express = require("express")
const multer = require("multer")
const router = express.Router()

// MULTER Configuaration //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "views/uploads")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})
const upload = multer({ storage: storage })

// Controller Functions //

const {
  editProfile,
  DeleteProfile,
  GetProfile,
  requestForgetPassword,
  forgetPassword,
  getAllNotifications,
  updateNotifications,
  GetSoftSkills,
} = require("../controllers/profile")

// middleware functions //

const {
  protect,
  authorize,
  dashboard,
  customer_dashboard,
} = require("../middlewares/auth")
// request for forget password //
router.post("/request-forget-password", requestForgetPassword)
// Update password //
router.post("/reset-password", forgetPassword)
// Get Single user  //
router.get("/get-profile/:id", protect, GetProfile)
router.get("/GetSoftSkills", protect, GetSoftSkills)

router.get("/getAllNotifications", protect, getAllNotifications)

// Edit Profile info //
router.put("/editProfile", protect, editProfile)
// Delete User Profile //
router.delete("/delete-profile", protect, DeleteProfile)
router.post("/updateNotifications/:id", protect, updateNotifications)

module.exports = router
