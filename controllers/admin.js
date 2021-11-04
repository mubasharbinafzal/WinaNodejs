const Joi = require("joi");
const nodemailer = require("nodemailer");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Skill = require("../models/Skill");
const Job = require("../models/Job");
const Company = require("../models/Company");
const Student = require("../models/Student");
const StudentConsultant = require("../models/StudentConsultant");
const CompanyConsultant = require("../models/CompanyConsultant");
const School = require("../models/School");
const Appointment = require("../models/Appointment");
const { socket, io } = require("../app");
// Get List of Skills
exports.skillList = asyncHandler(async (req, res, next) => {
  try {
    const listOfSkills = await Skill.find({ isDeleted: false }).sort({
      _id: -1,
    });
    res.status(200).json({ listOfSkills: listOfSkills });
  } catch (err) {
    next(err);
  }
});

// CREATE Skill
exports.createSkill = asyncHandler(async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      skillField: Joi.string(),
      skillType: Joi.string().valid("Soft Skill", "Hard Skill"),
    });

    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }
    const { skillField, skillType } = req.body;

    const newSkill = new Skill({
      skillField: skillField,
      skillType: skillType,
    });
    await newSkill.save();
    const skills = await Skill.find();
    res
      .status(200)
      .json({ message: "Skill Created Successfully", skills: skills });
  } catch (err) {
    next(err);
  }
});

// EDIT Skill
exports.editSkill = asyncHandler(async (req, res, next) => {
  try {
    const skillID = req.params.id;
    const schema = Joi.object().keys({
      skillField: Joi.string(),
      skillType: Joi.string().valid("Soft Skill", "Hard Skill"),
    });

    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }
    const { skillField, skillType } = req.body;
    const skill = await Skill.findByIdAndUpdate(
      skillID,
      {
        skillField: skillField,
        skillType: skillType,
      },
      {
        new: true,
      }
    );
    res.status(200).json({ message: "Skill Updated Successfully" });
  } catch (err) {
    next(err);
  }
});

//DELETE Skill
exports.deleteSkill = asyncHandler(async (req, res, next) => {
  try {
    const skillID = req.params.id;

    const skill = await Skill.findByIdAndUpdate(
      skillID,
      {
        isDeleted: true,
      },
      {
        new: true,
      }
    );
    res.status(200).json({ message: "Skill Deleted Successfully" });
  } catch (err) {
    next(err);
  }
});

//JOBS

// Get List of jobs
exports.jobList = asyncHandler(async (req, res, next) => {
  try {
    const jobList = await Job.find({ isDeleted: false });
    res.status(200).json({ ListOfJobs: jobList });
  } catch (err) {
    next(err);
  }
});

//Create Job
exports.CreateJob = asyncHandler(async (req, res, next) => {
  try {
    const requestedUser = await User.findById(req.user.id);
    const companyID = req.body.company;
    //validations
    const location_object = Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    });

    const schema = Joi.object().keys({
      title: Joi.string(),
      status: Joi.string().valid("open", "filled"),
      domain: Joi.string(),
      photo: Joi.string(),
      position: Joi.string(),
      startDate: Joi.string(),
      duration: Joi.string(),
      location: location_object,
      alternationRhythm: Joi.string(),
      softSkills: Joi.array(),
      hardSkills: Joi.array(),
      company: Joi.string(),
      ageRange: Joi.number().valid("18-20", "21-24", "25+"),
      levelOfEducation: Joi.string().valid(
        "1:Brevet",
        "2:CAP",
        "3:BEP",
        "4:MC",
        "5:BacGénéral",
        "6:BacProfessionel",
        "7:BTS",
        "8:DUT",
        "9:Licence",
        "10:Master",
        "11:Doctorat"
      ),
    });
    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }
    let UploadedPicture = "";
    if (req.file) {
      if (
        req.file.mimetype == "image/jpeg" ||
        req.file.mimetype == "image/jpg" ||
        req.file.mimetype == "image/png"
      ) {
        if (!(req.file.size <= 10485760)) {
          const error = new Error("Cannot upload file size greater than 10MB");
          error.status = 400;
          throw error;
        } else {
          UploadedPicture = {
            image: req.file.filename,
            status: "Pending",
          };
        }
      } else {
        const error = new Error(
          "Please select an image of File type JPEG/JPG/PNG"
        );
        error.status = 400;
        throw error;
      }
    }

    const {
      title,
      status,
      domain,
      position,
      startDate,
      duration,
      location,
      alternationRhythm,
      softSkills,
      hardSkills,
      levelOfEducation,
      ageRange,
    } = req.body;

    // Creating new student in Database //
    const newJob = new Job({
      title: title,
      status: status,
      domain: domain,
      position: position,
      startDate: startDate,
      duration: duration,
      location: location,
      alternationRhythm: alternationRhythm,
      photo: UploadedPicture || "",
      softSkills: softSkills,
      hardSkills: hardSkills,
      levelOfEducation: levelOfEducation,
      ageRange: ageRange,
      company: companyID,
    });
    await newJob.save();

    // Assigning new job ID to company //
    const company = await Company.findByIdAndUpdate(companyID, {
      $push: { job: newJob._id },
    });

    res.status(200).json({
      message: "Success! Job created.",
      job: newJob,
      user: requestedUser,
    });
  } catch (err) {
    next(err);
  }
});

//// Edit Job ////

exports.EditJob = asyncHandler(async (req, res, next) => {
  try {
    const requestedUser = await User.findById(req.user.id);
    const companyID = req.body.company;
    //validations
    const location_object = Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    });

    const schema = Joi.object().keys({
      title: Joi.string(),
      status: Joi.string().valid("open", "filled"),
      domain: Joi.string(),
      photo: Joi.string(),
      position: Joi.string(),
      startDate: Joi.string(),
      duration: Joi.string(),
      location: location_object,
      alternationRhythm: Joi.string(),
      softSkills: Joi.array(),
      hardSkills: Joi.array(),
      ageRange: Joi.number().valid("18-20", "21-24", "25+"),
      levelOfEducation: Joi.string().valid(
        "Brevet",
        "CAP",
        "BEP",
        "MC",
        "BacGénéral",
        "BacProfessionel",
        "BTS",
        "DUT",
        "Licence",
        "Master",
        "Doctorat"
      ),
    });
    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }
    let UploadedPicture = "";
    if (req.file) {
      if (
        req.file.mimetype == "image/jpeg" ||
        req.file.mimetype == "image/jpg" ||
        req.file.mimetype == "image/png"
      ) {
        if (!(req.file.size <= 10485760)) {
          const error = new Error("Cannot upload file size greater than 10MB");
          error.status = 400;
          throw error;
        } else {
          UploadedPicture = {
            image: req.file.filename,
            status: "Pending",
          };
        }
      } else {
        const error = new Error(
          "Please select an image of File type JPEG/JPG/PNG"
        );
        error.status = 400;
        throw error;
      }
    }

    const {
      title,
      domain,
      position,
      startDate,
      duration,
      location,
      alternationRhythm,
      softSkills,
      hardSkills,
      levelOfEducation,
      ageRange,
    } = req.body;

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      {
        title: title,
        domain: domain,
        position: position,
        startDate: startDate,
        duration: duration,
        location: location,
        alternationRhythm: alternationRhythm,
        photo: UploadedPicture || "",
        softSkills: softSkills,
        hardSkills: hardSkills,
        levelOfEducation: levelOfEducation,
        ageRange: ageRange,
      },
      {
        new: true,
      }
    );
    res
      .status(200)
      .json({ message: "Success! Job Updated by ADMIN", Job: updatedJob });
  } catch (err) {
    next(err);
  }
});

// Delete Job
exports.DeleteJob = asyncHandler(async (req, res, next) => {
  try {
    const jobID = req.params.id;
    const job = await Job.findById(jobID);
    const companyID = job.company;

    await Job.findByIdAndUpdate(jobID, {
      isDeleted: true,
    }).then(async () => {
      const company = await Company.findByIdAndUpdate(companyID, {
        $pull: { job: jobID },
      });
    });
    res
      .status(200)
      .json({ message: "Job has been deleted successfully by ADMIN" });
  } catch (err) {
    next(err);
  }
});

//Company

//GET ALL COMPANIES
exports.companyList = asyncHandler(async (req, res, next) => {
  try {
    const listOfCompanies = await Company.find({ isDeleted: false });
    res.status(200).json({ listOfCompanies: listOfCompanies });
  } catch (err) {
    next(err);
  }
});

// Register Company

exports.registerCompany = asyncHandler(async (req, res, next) => {
  try {
    const requestedUser = await User.findById(req.user.id);
    if (
      requestedUser.student ||
      requestedUser.company ||
      requestedUser.studentConsultant ||
      requestedUser.companyConsultant
    ) {
      const error = new Error("Access Denied!");
      error.status = 400;
      throw error;
    }
    // Validating body //
    const address_object = Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    });

    const schema = Joi.object().keys({
      name: Joi.string().max(250),
      address: address_object.required(),
      type: Joi.string().valid("Startup", "PME", "TPE", "GE", "ETI"),
      siretNumber: Joi.string()
        .max(20)
        .pattern(/^[0-9]+$/),
      website: Joi.string().uri().max(250),
      linkedIn: Joi.string().uri().max(300),
      groupName: Joi.string().max(100),
      positionHeld: Joi.string().max(250),
    });

    // Returns Error if any
    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }

    // parameters
    const {
      name,
      address,
      type,
      siretNumber,
      website,
      linkedIn,
      groupName,
      positionHeld,
    } = req.body;

    // Creating new Company in Database //
    const newCompany = new Company({
      name: name,
      address: address,
      type: type,
      siretNumber: siretNumber,
      website: website,
      linkedIn: linkedIn,
      groupName: groupName,
      contactPerson: {
        person: req.user.id,
        positionHeld: positionHeld,
      },
    });
    await newCompany.save();

    // Assigning new Company ID to Loggined In User //
    const user = await User.findByIdAndUpdate(req.user.id, {
      company: newCompany._id,
    });
    res.status(200).json({
      message: "Success! Company has been registered by ADMIN.",
      Company: newCompany,
      user: user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit Company
exports.editCompany = asyncHandler(async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id);
    let companyID = req.params.id;
    // Validating body //
    const address_object = Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    });

    const schema = Joi.object().keys({
      name: Joi.string().max(250),
      address: address_object.required(),
      type: Joi.string().valid("Startup", "PME", "TPE", "GE", "ETI"),
      siretNumber: Joi.string()
        .max(20)
        .pattern(/^[0-9]+$/),
      website: Joi.string().uri().max(250),
      linkedIn: Joi.string().uri().max(300),
      groupName: Joi.string().max(100),
      positionHeld: Joi.string().max(250),
    });

    // Returns Error if any
    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }

    // parameters
    const {
      name,
      address,
      type,
      siretNumber,
      website,
      linkedIn,
      groupName,
      positionHeld,
    } = req.body;

    const company = await Company.findByIdAndUpdate(
      companyID,
      {
        name: name,
        address: address,
        type: type,
        siretNumber: siretNumber,
        website: website,
        linkedIn: linkedIn,
        groupName: groupName,
        contactPerson: {
          person: req.user.id,
          positionHeld: positionHeld,
        },
      },
      { new: true }
    );
    res.status(200).json({
      message: "Company Updated Successfully by Admin!",
      company: company,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Company
exports.deleteCompany = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.user.id;
    const companyID = req.params.id;
    const requestedUser = await User.findById(userID);
    await Company.findByIdAndUpdate(
      companyID,
      {
        isDeleted: true,
      },
      { new: true }
    ).then(async () => {
      await Job.update(
        { company: companyID },
        { $set: { isDeleted: true } },
        { multi: true }
      );
    });

    res.status(200).json({ message: "Company has been deleted Successfully!" });
  } catch (err) {
    res.status(400).message({ message: err.message });
  }
});

//Users

// Create User
exports.registerUser = asyncHandler(async (req, res, next) => {
  try {
    // Validation for req.body //
    const address_object = Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    });

    const schema = Joi.object().keys({
      firstName: Joi.string().max(250).required(),
      lastName: Joi.string().max(250).required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .max(10)
        .pattern(/^[0-9]+$/)
        .required(),
      address: address_object.required(),
      type: Joi.string().valid(
        "student",
        "company",
        "studentConsultant",
        "companyConsultant"
      ),
      status: Joi.string().valid("active", "deactive"),
      password: Joi.string().min(6).max(255).required(),
      confirm_password: Joi.string().min(6).max(255).required(),
    });

    // Storing Error Responses in Result //
    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }

    const {
      firstName,
      lastName,
      type,
      status,
      email,
      password,
      confirm_password,
      address,
      phone,
    } = req.body;

    //// Check If Password and Confirm Password are same or not ////
    if (password !== confirm_password) {
      res.status(403).send("Password and Confirm Password are not same");
    }

    //// Check If user exist with this Email or not ////
    const result = await User.findOne({ email: email });
    if (result) {
      res.status(404).send("User already registered with this Email Address");
    } else {
      // Saving User in DataBase
      const user = await User.create({
        firstName,
        lastName,
        email,
        type,
        status: "active",
        address,
        password,
        phone,
      });

      res
        .status(200)
        .json({ message: "User created successfully", user: user });
    }
  } catch (err) {
    next(err);
  }
});

// GET single user Profile
exports.GetProfile = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.params.id;
    const user = await User.findById(userID);
    res.status(200).json({ user: user });
  } catch (err) {
    res.status(400).res.json({ message: err.message });
  }
});

// Edit profile
exports.editProfile = asyncHandler(async (req, res, next) => {
  // Validation for req.body //
  try {
    const userID = req.params.id;
    const address_object = Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    });

    const schema = Joi.object().keys({
      firstName: Joi.string().max(250).required(),
      lastName: Joi.string().max(250).required(),
      phone: Joi.string()
        .max(10)
        .pattern(/^[0-9]+$/)
        .required(),
      address: address_object.required(),
    });
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
    );
    res
      .status(200)
      .json({ message: "Profile updated successfully by ADMIN!", user: user });
  } catch (err) {
    res.status(400).res.json({ message: err.message });
  }
});

// Delete User profile
exports.DeleteProfile = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.params.id;
    const requestedUser = await User.findById(userID);
    const user = await User.findByIdAndUpdate(
      userID,
      {
        isDeleted: true,
      },
      { new: true }
    ).then(async () => {
      if (requestedUser.student) {
        await Student.findByIdAndUpdate(requestedUser.student, {
          isDeleted: true,
        });
      } else if (requestedUser.company) {
        await Company.findByIdAndUpdate(requestedUser.company, {
          isDeleted: true,
        });
      } else if (requestedUser.studentConsultant) {
        await StudentConsultant.findByIdAndUpdate(
          requestedUser.studentConsultant,
          {
            isDeleted: true,
          }
        );
      } else if (requestedUser.companyConsultant) {
        await CompanyConsultant.findByIdAndUpdate(
          requestedUser.companyConsultant,
          {
            isDeleted: true,
          }
        );
      }
    });
    res.status(200).json({ message: "User has been deleted Successfully!" });
  } catch (err) {
    next(err);
  }
});

// GET List of Users
exports.userList = asyncHandler(async (req, res, next) => {
  try {
    const listOfUsers = await User.find({ isDeleted: false });
    res.status(200).json({ listOfUsers: listOfUsers });
  } catch (err) {
    next(err);
  }
});

// Validate PICTURES & VIDEOS
exports.StudentfilesToValidate = asyncHandler(async (req, res, next) => {
  try {
    let pictures = [];
    let videos = [];
    const students = await Student.find({
      $and: [
        {
          $or: [
            { "professional_Picture.status": "To be Validated" },
            { "presentation_Video.status": "To be Validated" },
          ],
        },
        { isDeleted: false },
      ],
    });
    students.map((item) => {
      pictures.push(item.professional_Picture);
      videos.push(item.presentation_Video);
    });
    res
      .status(200)
      .json({ students: students, pictures: pictures, videos: videos });
  } catch (err) {
    next(err);
  }
});

// Validate PICTURES
exports.validateImages = asyncHandler(async (req, res, next) => {
  try {
    const decision = req.body.decision;
    const studentId = req.body.studentId;
    const requestedStudent = await Student.findById(studentId);
    const userID = requestedStudent.user;
    const user = await User.findById(userID);

    if (decision == "Validated") {
      const student = await Student.findByIdAndUpdate(studentId, {
        "professional_Picture.status": "Validated",
      });
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MailingId,
          pass: process.env.MailingPassword,
        },
      });
      var mailOptions = {
        to: user.email,
        from: process.env.MailingId,
        subject: "Success! Validation Successful",
        text: "Your Profile picture has been Validated successfully!",
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(400).json({ message: error.message });
        }
      });
      res.status(200).json({ message: "Picture validated" });
    } else if (decision == "refuse") {
      const student = await Student.findByIdAndUpdate(studentId, {
        $unset: { professional_Picture: 1 },
      });
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MailingId,
          pass: process.env.MailingPassword,
        },
      });
      var mailOptions = {
        to: user.email,
        from: process.env.MailingId,
        subject: "Validation failed",
        text: "Failure! Inappropriate profile picture.",
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(400).json({ message: error.message });
        }
      });

      res.status(200).json({ message: "Picture has been deleted" });
    }
  } catch (err) {
    next(err);
  }
});

// Validate Videos
exports.validateVideo = asyncHandler(async (req, res, next) => {
  try {
    const decision = req.body.decision;
    const studentId = req.body.studentId;
    const requestedStudent = await Student.findById(studentId);
    const userID = requestedStudent.user;
    const user = await User.findById(userID);

    if (decision == "Validated") {
      const student = await Student.findByIdAndUpdate(studentId, {
        "presentation_Video.status": "Validated",
      });
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MailingId,
          pass: process.env.MailingPassword,
        },
      });
      var mailOptions = {
        to: user.email,
        from: process.env.MailingId,
        subject: "Success! Validation Successful",
        text: "Your Presentational video has been Validated successfully!",
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(400).json({ message: error.message });
        }
      });
      res.status(200).json({ message: "Video validated" });
    } else if (decision == "refuse") {
      const student = await Student.findByIdAndUpdate(studentId, {
        $unset: { presentation_Video: 1 },
      });
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MailingId,
          pass: process.env.MailingPassword,
        },
      });
      var mailOptions = {
        to: user.email,
        from: process.env.MailingId,
        subject: "Validation failed",
        text: "Failure! Inappropriate presentational video.",
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(400).json({ message: error.message });
        }
      });
      res.status(200).json({ message: "Video has been deleted" });
    }
  } catch (err) {
    next(err);
  }
});

//Validate Job Images
exports.validateJobImages = asyncHandler(async (req, res, next) => {
  try {
    const decision = req.body.decision;
    const jobID = req.body.jobID;
    const requestedJob = await Job.findById(jobID);
    const companyID = requestedJob.company;
    const company = await Company.findById(companyID);
    const userID = company.contactPerson.person;

    const user = await User.findById(userID);
    if (decision == "Validated") {
      const job = await Job.findByIdAndUpdate(jobID, {
        "photo.status": "Validated",
      });
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MailingId,
          pass: process.env.MailingPassword,
        },
      });
      var mailOptions = {
        to: user.email,
        from: process.env.MailingId,
        subject: "Success! Validation Successful",
        text: "Your job picture has been Validated successfully!",
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(400).json({ message: error.message });
        }
      });
      res.status(200).json({ message: "Picture validated" });
    } else if (decision == "refuse") {
      const job = await Job.findByIdAndUpdate(jobID, {
        $unset: { photo: 1 },
      });
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MailingId,
          pass: process.env.MailingPassword,
        },
      });
      var mailOptions = {
        to: user.email,
        from: process.env.MailingId,
        subject: "Validation failed",
        text: "Failure! Inappropriate job picture.",
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(400).json({ message: error.message });
        }
      });

      res.status(200).json({ message: "Image has been deleted" });
    }
  } catch (err) {
    next(err);
  }
});

// Create Consultant Profile
exports.createConsultantProfile = asyncHandler(async (req, res, next) => {
  try {
    // Validation for req.body //
    const address_object = Joi.object().keys({
      street: Joi.string().required(),
      city: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    });

    const schema = Joi.object().keys({
      firstName: Joi.string().max(250).required(),
      lastName: Joi.string().max(250).required(),
      type: Joi.string().valid("studentConsultant", "companyConsultant"),
      status: Joi.string().valid("active", "deactive"),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .max(10)
        .pattern(/^[0-9]+$/)
        .required(),
      address: address_object.required(),
      password: Joi.string().min(6).max(255).required(),
      confirm_password: Joi.string().min(6).max(255).required(),
    });

    // Storing Error Responses in Result //
    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }

    const {
      firstName,
      lastName,
      type,
      status,
      email,
      password,
      confirm_password,
      address,
      phone,
    } = req.body;

    //// Check If Password and Confirm Password are same or not ////
    if (password !== confirm_password) {
      res.status(403).send("Password and Confirm Password are not same");
    }

    //// Check If user exist with this Email or not ////
    const result = await User.findOne({ email: email });
    if (result) {
      res.status(404).send("User already registered with this Email Address");
    } else {
      // Saving User in DataBase
      const user = await User({
        firstName,
        lastName,
        type,
        status,
        email,
        address,
        password,
        phone,
      });
      user.save().then(async () => {
        if (type == "studentConsultant") {
          const studentConsultant = new StudentConsultant({
            user: user._id,
            video: "video",
            professional_Picture: "DEFAULT.png",
          });
          studentConsultant.save().then(async () => {
            await User.findByIdAndUpdate(user._id, {
              studentConsultant: studentConsultant._id,
            });
          });
          res
            .status(200)
            .json({ user: user, studentConsultant: studentConsultant });
        } else if (type == "companyConsultant") {
          const companyConsultant = new CompanyConsultant({
            user: user._id,
            video: "video",
            professional_Picture: "DEFAULT.png",
          });
          companyConsultant.save().then(async () => {
            await User.findByIdAndUpdate(user._id, {
              companyConsultant: companyConsultant._id,
            });
          });
          res
            .status(200)
            .json({ user: user, companyConsultant: companyConsultant });
        }
      });
    }
  } catch (err) {
    next(err);
  }
});
exports.consultantProfileTeacher = asyncHandler(async (req, res, next) => {
  try {
    const data = await CompanyConsultant.find({ isDeleted: false })
      .populate("user")
      .sort({
        _id: -1,
      });
    res.status(200).json({ consultantTeacher: data });
  } catch (err) {
    next(err);
  }
});
exports.consultantProfileStudent = asyncHandler(async (req, res, next) => {
  try {
    const data = await StudentConsultant.find({ isDeleted: false })
      .populate("user")
      .sort({
        _id: -1,
      });
    res.status(200).json({ consultantStudent: data });
  } catch (err) {
    next(err);
  }
});
// SCHOOLS
exports.registerSchool = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.user._id;
    const user = await User.findById(userID);
    const schema = Joi.object().keys({
      secteur_d_etablissement: Joi.string(),
      code_postal_uai: Joi.string(),
      coordonnees: Joi.array().length(2),
      uo_lib: Joi.string(),
    });

    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }
    const { secteur_d_etablissement, code_postal_uai, coordonnees, uo_lib } =
      req.body;

    const newSchool = new School({
      fields: {
        uo_lib: uo_lib,
        secteur_d_etablissement: secteur_d_etablissement,
        code_postal_uai: code_postal_uai,
        coordonnees: coordonnees,
      },
      createdBy: user.role,
    });
    await newSchool.save();
    res
      .status(200)
      .json({ message: "School Created Successfully", school: newSchool });
  } catch (err) {
    next(err);
  }
});

// Edit School //
exports.editSchool = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.user._id;
    const user = await User.findById(userID);
    const schoolId = req.params.id;

    const schema = Joi.object().keys({
      secteur_d_etablissement: Joi.string(),
      code_postal_uai: Joi.string(),
      coordonnees: Joi.array().length(2),
      uo_lib: Joi.string(),
    });

    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }
    const { secteur_d_etablissement, code_postal_uai, coordonnees, uo_lib } =
      req.body;
    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      {
        fields: {
          uo_lib: uo_lib,
          secteur_d_etablissement: secteur_d_etablissement,
          code_postal_uai: code_postal_uai,
          coordonnees: coordonnees,
        },
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "School updated Successfully", school: updatedSchool });
  } catch (err) {
    next(err);
  }
});

// Delete School //
exports.deleteSchool = asyncHandler(async (req, res, next) => {
  try {
    const schoolId = req.params.id;

    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      {
        isDeleted: true,
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "School deleted Successfully", school: updatedSchool });
  } catch (err) {
    next(err);
  }
});

// Appoitmnets API's
//GET All Appointments

exports.getAllAppointments = asyncHandler(async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ isDeleted: false }).populate(
      "company"
    );
    if (!appointments) {
      res.status(200).json({ message: "There is no Appointment ATM" });
    } else {
      res.status(200).json({ message: "Success!", Appointments: appointments });
    }
  } catch (err) {
    next(err);
  }
});

//GET All Pending Appointments

exports.getAllPendingAppointments = asyncHandler(async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ status: "Pending" });
    if (!appointments) {
      res.status(200).json({ message: "There is no Appointment ATM" });
    } else {
      res.status(200).json({ message: "Success!", Appointments: appointments });
    }
  } catch (err) {
    next(err);
  }
});

//GET All Pending Student Appointments
exports.getAllStudentAppointments = asyncHandler(async (req, res, next) => {
  try {
    let filteredArray = [];
    const appointments = await Appointment.find({
      status: "Pending",
    });
    const result = appointments.filter((item) => {
      if (item.student) {
        filteredArray.push(item);
      }
    });
    if (filteredArray.length == 0) {
      res.status(200).json({ message: "There is no Appointment ATM" });
    } else {
      res
        .status(200)
        .json({ message: "Success!", Appointments: filteredArray });
    }
  } catch (err) {
    next(err);
  }
});

//GET All Pending Company Appointments
exports.getAllCompanyAppointments = asyncHandler(async (req, res, next) => {
  try {
    let filteredArray = [];
    const appointments = await Appointment.find({
      status: "Pending",
    });
    const result = appointments.filter((item) => {
      if (item.company) {
        filteredArray.push(item);
      }
    });
    if (filteredArray.length == 0) {
      res.status(200).json({ message: "There is no Appointment ATM" });
    } else {
      res
        .status(200)
        .json({ message: "Success!", Appointments: filteredArray });
    }
  } catch (err) {
    next(err);
  }
});

//Delete Appointment
exports.editAppointment = asyncHandler(async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const appointmnet = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        timmings: req.body.slotTimmings,
        status: req.body.status,
      },
      {
        new: true,
      }
    );
    res.status(200).json({ message: "Success! Appointment Edited" });
  } catch (err) {
    next(err);
  }
});

//Edit Appointment
exports.deleteAppointment = asyncHandler(async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const appointmnet = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        isDeleted: true,
      },
      {
        new: true,
      }
    );
    res.status(200).json({ message: "Success! Appointment Deleted" });
  } catch (err) {
    next(err);
  }
});

// Validate students appointments for coaching
exports.validateAppointment = asyncHandler(async (req, res, next) => {
  try {
    //Parameters
    const decision = req.body.decision;
    const appointmentId = req.body.appointmentId;

    // if "Approve" pass Consultant ID
    const consultantId = req.body.consultantId;
    //Declarations
    const result = await Appointment.findById(appointmentId);
    if (result.student) {
      if (decision == "Approve") {
        const consultant = await StudentConsultant.findById(consultantId);
        const appointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          {
            studentConsultant: consultantId,
            status: "Approved",
          },
          { new: true }
        );
        const student = await Student.findById(appointment.student);
        const user = await User.findByIdAndUpdate(
          student.user,
          {
            $push: {
              notifications: {
                title: "Success! Appointment Approved",
                description: "Your Appointment has been approved successfully",
              },
            },
          },
          { new: true }
        );

        // Sending Notification //
        socket.broadcast.emit(`recieveNotification${student.user}`, {
          title: "Success! Appointment Approved",
          message: "Your Appointment has been approved successfully",
        });

        const consultantUser = await User.findByIdAndUpdate(consultant.user, {
          $push: {
            notifications: {
              title: "Appointment Scheduled",
              description: "Admin has assigned you an appointment",
            },
          },
        });

        // Sending Notification //
        socket.broadcast.emit(`recieveNotification${consultant.user}`, {
          title: "Appointment Scheduled",
          message: "Admin has assigned you an appointment",
        });

        // Sending success mail
        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          tls: {
            rejectUnauthorized: false,
          },
          auth: {
            user: process.env.MailingId,
            pass: process.env.MailingPassword,
          },
        });
        var mailOptions = {
          to: user.email,
          from: process.env.MailingId,
          subject: "Success! Validation Successful",
          text: "Your request for Coaching Appointment has been Approved!",
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(400).json({ message: error.message });
          }
        });

        res.status(200).json({ message: "Appointment approved successfully!" });
      } else if (decision == "Disapprove") {
        const appointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          {
            status: "Disapproved",
          },
          { new: true }
        );
        const student = await Student.findById(appointment.student);
        const studentUser = await User.findByIdAndUpdate(
          student.user,
          {
            $push: {
              notifications: {
                title: "Appointment Cancelled",
                description: "Your Appointment has been cancelled by the Admin",
              },
            },
          },
          { new: true }
        );

        // Sending Notification //
        socket.broadcast.emit(`recieveNotification${student.user}`, {
          title: "Appointment Cancelled",
          message: "Your Appointment has been cancelled by the Admin",
        });

        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          tls: {
            rejectUnauthorized: false,
          },
          auth: {
            user: process.env.MailingId,
            pass: process.env.MailingPassword,
          },
        });
        var mailOptions = {
          to: studentUser.email,
          from: process.env.MailingId,
          subject: "Validation Failed",
          text: "Your request for Coaching Appointment has been cancelled!",
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(400).json({ message: error.message });
          }
        });
        res.status(200).json({ message: "Appointment cancelled!" });
      }
    }
    if (result.company) {
      if (decision == "Approve") {
        const consultant = await CompanyConsultant.findById(consultantId);
        const appointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          {
            companyConsultant: consultantId,
            status: "Approved",
          },
          { new: true }
        );
        const company = await Company.findById(appointment.company);
        const user = await User.findByIdAndUpdate(
          company.contactPerson.person,
          {
            $push: {
              notifications: {
                title: "Success! Appointment Approved",
                description: "Your Appointment has been approved successfully",
              },
            },
          },
          { new: true }
        );

        // Sending Notification //
        socket.broadcast.emit(
          `recieveNotification${company.contactPerson.person}`,
          {
            title: "Success! Appointment Approved",
            message: "Your Appointment has been approved successfully",
          }
        );

        const consultantUser = await User.findByIdAndUpdate(consultant.user, {
          $push: {
            notifications: {
              title: "Appointment Scheduled",
              description: "Admin has assigned you an appointment",
            },
          },
        });

        // Sending Notification //
        socket.broadcast.emit(`recieveNotification${consultant.user}`, {
          title: "Appointment Scheduled",
          message: "Admin has assigned you an appointment",
        });

        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          tls: {
            rejectUnauthorized: false,
          },
          auth: {
            user: process.env.MailingId,
            pass: process.env.MailingPassword,
          },
        });
        var mailOptions = {
          to: user.email,
          from: process.env.MailingId,
          subject: "Success! Validation Successful",
          text: "Your request for Coaching Appointment has been Approved!",
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(400).json({ message: error.message });
          }
        });

        res.status(200).json({ message: "Appointment approved successfully!" });
      } else if (decision == "Disapprove") {
        const appointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          {
            status: "Disapproved",
          },
          { new: true }
        );
        const company = await Student.findById(appointment.company);
        const compnayUser = await User.findByIdAndUpdate(
          company.user,
          {
            $push: {
              notifications: {
                title: "Appointment Cancelled",
                description: "Your Appointment has been cancelled by the Admin",
              },
            },
          },
          { new: true }
        );

        // Sending Notification //
        socket.broadcast.emit(`recieveNotification${company.user}`, {
          title: "Appointment Cancelled",
          message: "Your Appointment has been cancelled by the Admin",
        });

        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          tls: {
            rejectUnauthorized: false,
          },
          auth: {
            user: process.env.MailingId,
            pass: process.env.MailingPassword,
          },
        });
        var mailOptions = {
          to: user.email,
          from: process.env.MailingId,
          subject: "Success! Validation Successful",
          text: "Your request for Coaching Appointment has been cancelled!",
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(400).json({ message: error.message });
          }
        });
        res.status(200).json({ message: "Appointment cancelled!" });
      }
    }
  } catch (err) {
    next(err);
  }
});
exports.addMsg = asyncHandler(async (req, res, next) => {
  // const { name } = req.body;
  // socket.broadcast.emit(`recieveNotification`, {
  //   title: "Appointment Cancelled",
  //   message: "Your Appointment has been cancelled by the Admin",
  // });
  // res.status(200).json({ name: name });
});
