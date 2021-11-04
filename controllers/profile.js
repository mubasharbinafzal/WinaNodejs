const Joi = require("joi")
const asyncHandler = require("../middlewares/async")
const User = require("../models/User")
const Student = require("../models/Student")
const Company = require("../models/Company")
const Skill = require("../models/Skill")

const crypto = require("crypto")
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")

// GET single user Profile
exports.GetProfile = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.params.id
    const user = await User.findById(userID).populate("student")
    res.status(200).json({ user: user })
  } catch (err) {
    res.status(400).res.json({ message: err.message })
  }
})

// Edit profile
exports.editProfile = asyncHandler(async (req, res, next) => {
  const userID = req.user.id
  // Validation for req.body //
  try {
    const address_object = Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    })

    const schema = Joi.object().keys({
      firstName: Joi.string().max(250).required(),
      lastName: Joi.string().max(250).required(),
      phone: Joi.string()
        .max(10)
        .pattern(/^[0-9]+$/)
        .required(),
      address: address_object.required(),
    })
    // Check if the skills are in database or not, If Not then saving them in the database//

    const user = await User.findByIdAndUpdate(
      userID,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address: req.body.address,
        phone: req.body.phone,
      },
      { new: true }
    )
    res
      .status(200)
      .json({ message: "Profile updated successfully!", user: user })
  } catch (err) {
    res.status(400).res.json({ message: err.message })
  }
})

// Delete User profile
exports.DeleteProfile = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.user.id
    const requestedUser = await User.findById(req.user.id)
    const user = await User.findByIdAndUpdate(
      userID,
      {
        isDeleted: true,
      },
      { new: true }
    ).then(async () => {
      await Student.findByIdAndUpdate(
        requestedUser.student,
        {
          isDeleted: true,
        },
        { new: true }
      )
    })
    res.status(200).json({ message: "User has been deleted Successfully!" })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

//Forget Password//
exports.requestForgetPassword = asyncHandler(async (req, res, next) => {
  try {
    const email = req.body.email
    const user = await User.findOne({ email: email })
    if (!user) {
      res.status(400).json({ message: "NO user found with this email" })
    } else {
      const buf = await crypto.randomBytes(20)
      var token = buf.toString("hex")
      const restPasswordExpires = Date.now() + 36000000
      await User.findOneAndUpdate(
        { email: email },
        {
          resetPasswordToken: token,
          restPasswordExpires: restPasswordExpires,
        },
        { new: true }
      )
      var smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MailingId,
          pass: process.env.MailingPassword,
        },
      })
      var mailOptions = {
        to: email,
        from: process.env.MailingId,
        subject: "Password Reset",
        text:
          "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
          "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          "http://" +
          `${process.env.verifyEmail}` +
          "/reset/" +
          token +
          "\n\n" +
          "If you did not request this, please ignore this email and your password will remain unchanged.\n",
      }
      await smtpTransport
        .sendMail(mailOptions)
        .then((res) => {
          console.log("mail res", res)
        })
        .catch((err) => res.status(400).json({ message: err.message }))
      res.status(200).json({ message: "Email has been sent successfully" })
    }
  } catch (err) {
    res.status(400).json({ message: err.message })
    next(err)
  }
})

//Forget Password update//
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  try {
    // console.log(req.body);
    const user = await User.findOne({
      resetPasswordToken: req.query.passwordToken,
      restPasswordExpires: {
        $gt: Date.now(),
      },
    })

    if (!user) {
      res.status(400).json({
        message: "Password reset token is invalid or has expired.",
      })
    }
    if (req.body.password === req.body.confirm) {
      const salt = await bcrypt.genSalt(10)
      const updatedPassword = await bcrypt.hash(req.body.password, salt)

      var updatedUser = await User.findOneAndUpdate(
        {
          resetPasswordToken: req.query.passwordToken,
        },
        {
          password: updatedPassword,
          $unset: { resetPasswordToken: 1, restPasswordExpires: 1 },
        },
        { new: true }
      )
    } else {
      res.status(400).json({ message: "Passwords donot match" })
    }

    var smtpTransport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MailingId,
        pass: process.env.MailingPassword,
      },
    })
    var mailOptions = {
      to: user.email,
      from: process.env.MailingId,
      subject: "Your password has been changed",
      text:
        "Hello,\n\n" +
        "This is a confirmation that the password for your account " +
        user.email +
        " has just been changed.\n",
    }
    smtpTransport.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(400).json({ message: error.message })
      }
    })
    res
      .status(200)
      .json({ message: "Password updated successfully", user: updatedUser })
  } catch (err) {
    next(err)
  }
})

// Get all Notifications //
exports.getAllNotifications = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
      },
      {
        path: "student",
      },
      {
        path: "hardSkills",
      },
    ]
    const requestedUser = await User.findById(req.user.id).populate(
      populateQuery
    )
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" })
    } else {
      if (requestedUser.type === "company") {
        const notifications = requestedUser.company.notifications.filter(
          (not) => not.statusNew == true
        )

        res
          .status(200)
          .json({ message: "Success!", notifications: notifications })
      } else {
        const notifications = requestedUser.student.notifications.filter(
          (not) => not.statusNew == true
        )
        res
          .status(200)
          .json({ message: "Success!", notifications: notifications })
      }
    }
  } catch (err) {
    next(err)
  }
})

// update user notification
exports.updateNotifications = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.params.id
    const requestedUser = await User.findById(req.user.id)
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" })
    }
    let tempNotify
    // console.log(loggedInUser, "loggedIn");
    if (requestedUser.type === "student") {
      let user = await Student.findById(requestedUser.student).populate(
        "student"
      )
      tempNotify = user.notifications
      await Student.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            "notifications.$[el].statusNew": false,
            "notifications.$[el].color": "white",
          },
        },
        {
          arrayFilters: [{ "el._id": `${userId}` }],
          new: true,
        }
      )
    } else if (requestedUser.type === "company") {
      let user = await Company.findById(requestedUser.company).populate(
        "company"
      )

      tempNotify = user.notifications
      await Company.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            "notifications.$[el].statusNew": false,
            "notifications.$[el].color": "#fff",
          },
        },
        {
          arrayFilters: [{ "el._id": `${userId}` }],
          new: true,
        }
      )
    }

    res.status(200).json({ message: "Success!", notifications: tempNotify })
  } catch (err) {
    next(err)
  }
})

// GetSoftSkills
exports.GetSoftSkills = asyncHandler(async (req, res, next) => {
  try {
    const skills = await Skill.find({
      $and: [
        { skillType: { $eq: "Soft Skill" } },
        {
          isDeleted: { $eq: false },
        },
      ],
    })

    if (skills) {
      res
        .status(200)
        .send({ skills: skills, message: "Skills has fetched successfully" })
    }
  } catch (error) {
    res.status(200).send({ message: error.message })
    next(error)
  }
})
