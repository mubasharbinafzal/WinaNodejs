const router = require("express").Router()
const Student = require("../models/Student")

const { upload } = require("../middlewares/multer")

router.post("/fileUpload", upload, async (req, res, next) => {
  if (req.files) {
    if (
      req.files.image[0].mimetype == "image/jpeg" ||
      req.files.image[0].mimetype == "image/jpg" ||
      req.files.image[0].mimetype == "image/png"
    ) {
      if (!(req.files.image[0].size <= 10485760)) {
        const error = new Error("Cannot upload file size greater than 10MB")
        error.status = 400
        throw error
      } else {
        res.status(200).json(req.files.image[0].path)

        UploadedPicture = {
          image: req.files.image[0].filename,
          status: "To be Validated",
        }
      }
    } else {
      res.status(400).send({
        message: "Please select an image of File type JPEG/JPG/PNG",
      })
      const error = new Error(
        "Please select an image of File type JPEG/JPG/PNG"
      )
      error.status = 400
      throw error
    }
  }
})
router.post("/resumeUpload", upload, async (req, res, next) => {
  if (req.files) {
    if (
      req.files.resume[0].mimetype === "application/pdf" ||
      req.files.resume[0].mimetype === "application/msword"
    ) {
      if (!(req.files.resume[0].size <= 10485760)) {
        res
          .status(400)
          .send({ message: "Cannot upload file size greater than 10MB" })
      } else {
        uploadedResume = req.files.resume[0].filename
        await Student.findByIdAndUpdate(req.body.id, {
          resume: uploadedResume,
        })
        res.status(200).send({ message: "File upload successfully" })
      }
    } else {
      res.status(400).send({
        message: "Your resume file should be of File type PDF/DOC/DOCX",
      })
      // error.status = 400;
      // throw error;
    }
  }
})

module.exports = router
