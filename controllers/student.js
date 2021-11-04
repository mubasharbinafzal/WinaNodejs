const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Student = require("../models/Student");
const Appointment = require("../models/Appointment");
const matchingAlgo = require("../services/searchJobs");
const Skill = require("../models/Skill");

var matchingCriteria = new matchingAlgo.MatchingCriteria();
var dealBreaker = new matchingAlgo.DealBreaker();
//// Register User Profile ////

exports.register = asyncHandler(async (req, res, next) => {
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
    const userType = req.user.type;
    let UploadedPicture = "";
    let video = "";
    let uploadedResume = "";

    // Validating body //
    const professional_network = Joi.object().keys({
      linkedIn: Joi.string().uri(),
      Behance: Joi.string().uri(),
      Dribble: Joi.string().uri(),
      Github: Joi.string().uri(),
    });

    const education_info = Joi.object().keys({
      school: Joi.string(),
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
      end_Date: Joi.string(),
      description: Joi.string().max(600),
    });

    const professional_profileInfo = Joi.object().keys({
      position: Joi.string().max(250),
      company: Joi.string().max(250),
      duration: Joi.object().keys({
        start_date: Joi.string(),
        end_date: Joi.string(),
      }),
      description: Joi.string().max(1000),
    });

    const schema = Joi.object().keys({
      general_Presentation: Joi.string().max(2000),
      presentation_Video: Joi.string(),
      professional_Picture: Joi.string(),
      professional_networks: professional_network,
      education: Joi.array().items(education_info),
      professional_profile: Joi.array().items(professional_profileInfo),
      softSkills: Joi.array(),
      hardSkills: Joi.array(),
      resume: Joi.string(),
      positionSought: Joi.object().keys({
        domain: Joi.string(),
        position: Joi.string(),
        startDate: Joi.string(),
        duration: Joi.string(),
        alternationRhythm: Joi.string(),
        dateOfBirth: Joi.string(),
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
      }),

      languages: Joi.array().items({
        name: Joi.string(),
        skill: Joi.string().valid(
          "beginner",
          "intermediate",
          "fluent",
          "native"
        ),
      }),
    });

    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }

    //Storing uploaded image/video name in "UploadedPicture" / "presentation_Video" //
    if (req.files) {
      if (req.files.video) {
        if (req.files.video[0].mimetype == "video/mp4") {
          if (!(req.files.video[0].size <= 209715200)) {
            const error = new Error(
              "Cannot upload file size greater than 200MB"
            );
            error.status = 400;
            throw error;
          } else {
            video = {
              video: req.files.video[0].filename,
              status: "To be Validated",
            };
          }
        }
      }
      if (req.files.image) {
        if (
          req.files.image[0].mimetype == "image/jpeg" ||
          req.files.image[0].mimetype == "image/jpg" ||
          req.files.image[0].mimetype == "image/png"
        ) {
          UploadedPicture = {
            image: req.files.image[0].filename,
            status: "To be Validated",
          };
        } else {
          const error = new Error(
            "Please select an image of File type JPEG/JPG/PNG"
          );
          error.status = 400;
          throw error;
        }
      }
      if (req.files.resume) {
        if (
          req.files.resume[0].mimetype === "resume/pdf" ||
          req.files.resume[0].mimetype === "resume/msword" ||
          req.files.resume[0].mimetype ===
            "resume/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          if (!(req.files.resume[0].size <= 10485760)) {
            const error = new Error(
              "Cannot upload file size greater than 10MB"
            );
            error.status = 400;
            throw error;
          } else {
            uploadedResume = req.files.resume[0].filename;
          }
        } else {
          const error = new Error(
            "Your resume file should be of File type PDF/DOC/DOCX"
          );
          error.status = 400;
          throw error;
        }
      }
    }

    const {
      general_Presentation,
      professional_networks,
      professional_profile,
      education,
      softSkills,
      hardSkills,
      resume,
      positionSought,

      languages,
    } = req.body;

    // Creating new student in Database //
    const newStudent = await new Student({
      general_Presentation: general_Presentation,
      presentation_Video: video,
      professional_Picture: UploadedPicture,
      professional_networks: professional_networks,
      professional_profile: professional_profile,
      education: education,
      softSkills: softSkills,
      hard_Skills: hardSkills,
      positionSought: positionSought,

      languages: languages,
      resume: uploadedResume,
      user: req.user.id,
    });

    await newStudent.save();

    // Assigning new student ID to Loggined In User //
    const user = await User.findByIdAndUpdate(req.user.id, {
      student: newStudent._id,
    });

    res
      .status(200)
      .json({ message: "Success!", student: newStudent, user: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET single Student Profile
exports.GetStudentProfile = asyncHandler(async (req, res, next) => {
  try {
    const studentID = req.params.id;
    const student = await Student.findById(studentID).populate("student");
    res.status(200).json({ user: student });
  } catch (err) {
    next(err);
  }
});

//// Edit Student info ////
exports.edit = asyncHandler(async (req, res, next) => {
  const {
    general_Presentation,
    professional_networks,
    professional_profile,
    education,
    softSkills,
    hardSkills,
    positionSought,

    languages,
  } = req.body;
  let UploadedPicture = "";
  let video = "";
  let uploadedResume = "";
  let EDUCATION;
  let PROFESSION_INFO;
  let PROFESSIONAL_NETWORKS;

  if (professional_networks) {
    PROFESSIONAL_NETWORKS = JSON.parse(professional_networks);
    req.body.professional_networks = PROFESSIONAL_NETWORKS;
  }
  if (education) {
    EDUCATION = JSON.parse(education);
    req.body.education = EDUCATION;
  }
  if (professional_profile) {
    PROFESSION_INFO = JSON.parse(professional_profile);
    req.body.professional_profile = PROFESSION_INFO;
  }
  const user = await User.findById(req.user.id);
  try {
    // Validating body //
    const professional_network = Joi.object().keys({
      linkedIn: Joi.string().uri().optional().allow(""),
      Behance: Joi.string().uri().optional().allow(""),
      Dribble: Joi.string().uri().optional().allow(""),
      Github: Joi.string().uri().optional().allow(""),
    });

    const education_info = Joi.object().keys({
      school: Joi.string(),
      image: Joi.string(),

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
      end_Date: Joi.string(),
      start_Date: Joi.string(),
      description: Joi.string().max(600),
    });

    const professional_profileInfo = Joi.object().keys({
      position: Joi.string().max(250),
      type: Joi.string().max(250),
      place: Joi.string().max(250),
      position_hold: Joi.boolean(),
      image: Joi.string(),

      company: Joi.string().max(250),
      duration: Joi.object().keys({
        start_date: Joi.string(),
        end_date: Joi.string(),
      }),
      description: Joi.string().max(1000),
    });

    const schema = Joi.object().keys({
      general_Presentation: Joi.string().max(2000).optional().allow(""),
      presentation_Video: Joi.string(),
      image: Joi.string(),

      // School_Index: Joi.number(),

      professional_Picture: Joi.string(),
      professional_networks: professional_network,
      education: Joi.array().items(education_info),
      professional_profile: Joi.array().items(professional_profileInfo),
      resume: Joi.string(),

      softSkills: Joi.array(),
      hardSkills: Joi.array(),
      positionSought: Joi.object().keys({
        domain: Joi.string(),
        position: Joi.string(),
        startDate: Joi.string(),
        duration: Joi.string(),
        alternationRhythm: Joi.string(),
        description: Joi.string(),
        dateOfBirth: Joi.string(),
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
      }),

      languages: Joi.array().items({
        name: Joi.string(),
        skill: Joi.string().valid(
          "beginner",
          "intermediate",
          "fluent",
          "native"
        ),
      }),
    });
    // Pasrsing

    const results = schema.validate(req.body);
    if (results.error) {
      return res
        .status(400)
        .send({ message: results.error.details[0].message });
    }
    if (softSkills) {
      await Promise.all(
        await softSkills.map(async (val) => {
          const requestedMaterial = val.skillName;
          console.log(requestedMaterial, "result");

          if (requestedMaterial) {
            const result = await Skill.find({ skillField: val.skillName });
            console.log(result, "result");
            // if (result.length == 0) {
            //   const newMaterial = new Material({
            //     name: requestedMaterial,
            //   });
            //   await newMaterial.save().then((val.material = newMaterial._id));
            // }
          }
        })
      );
    }
    //Storing uploaded image/video name in "UploadedPicture" / "presentation_Video" //
    if (req.files) {
      if (req.files.video) {
        if (req.files.video[0].mimetype == "video/mp4") {
          if (!(req.files.video[0].size <= 209715200)) {
            const error = new Error(
              "Cannot upload file size greater than 200MB"
            );
            error.status = 400;
            throw error;
          } else {
            video = {
              video: req.files.video[0].filename,
              status: "To be Validated",
            };
          }
        }
      }
      if (req.files.image) {
        if (
          req.files.image[0].mimetype == "image/jpeg" ||
          req.files.image[0].mimetype == "image/jpg" ||
          req.files.image[0].mimetype == "image/png"
        ) {
          UploadedPicture = {
            image: req.files.image[0].filename,
            status: "To be Validated",
          };
        } else {
          const error = new Error(
            "Please select an image of File type JPEG/JPG/PNG"
          );
          error.status = 400;
          throw error;
        }
      }

      if (req.files.resume) {
        if (
          req.files.resume[0].mimetype === "resume/pdf" ||
          req.files.resume[0].mimetype === "resume/msword" ||
          req.files.resume[0].mimetype ===
            "resume/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          if (!(req.files.resume[0].size <= 10485760)) {
            const error = new Error(
              "Cannot upload file size greater than 10MB"
            );
            error.status = 400;
            throw error;
          } else {
            uploadedResume = req.files.resume[0].filename;
          }
        } else {
          const error = new Error(
            "Your resume file should be of File type PDF/DOC/DOCX"
          );
          error.status = 400;
          throw error;
        }
      }
    }

    const studentID = user.student;
    // console.log(EDUCATION, "EDUCATION");

    // let parsed_professional_network = JSON.parse(professional_networks);
    let userobj;
    if (studentID) {
      let tempUser = await Student.findById(studentID);
      userobj = await Student.findByIdAndUpdate(
        studentID,
        {
          general_Presentation: general_Presentation
            ? general_Presentation
            : tempUser.general_Presentation,
          presentation_Video: video ? video : tempUser.presentation_Video,
          professional_Picture: UploadedPicture
            ? UploadedPicture
            : tempUser.professional_Picture,
          professional_networks: PROFESSIONAL_NETWORKS
            ? PROFESSIONAL_NETWORKS
            : tempUser.professional_networks,
          professional_profile: PROFESSION_INFO
            ? PROFESSION_INFO
            : tempUser.professional_profile,
          softSkills: softSkills ? softSkills : tempUser.softSkills,
          hardSkills: hardSkills ? hardSkills : tempUser.hardSkills,
          education: EDUCATION ? EDUCATION : tempUser.education,
          positionSought: positionSought
            ? positionSought
            : tempUser.positionSought,

          resume: uploadedResume,
          languages: languages ? languages : tempUser.languages,
        },
        { new: true }
      );
    } else {
      // Creating new student in Database //
      userobj = new Student({
        general_Presentation: general_Presentation,
        presentation_Video: video,
        professional_Picture: UploadedPicture,
        professional_networks: professional_networks,
        professional_profile: professional_profile,
        education: education,
        softSkills: softSkills,
        hard_Skills: hardSkills,
        positionSought: positionSought,

        languages: languages,
        resume: uploadedResume,
        user: user._id,
      });

      await userobj.save();

      // Assigning new student ID to Loggined In User //
      await user.updateOne({
        student: userobj._id,
      });
    }

    const updateUser = await User.findByIdAndUpdate(req.user.id, {
      student: userobj._id,
    }).populate("student");

    res
      .status(200)
      .json({ message: "Profile Updated Successfully!", user: updateUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
    next(err);
  }
});

// GET single Student Profile
exports.DeleteProfile = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.user.id;
    const requestedUser = await User.findById(userID);
    await Student.findByIdAndUpdate(
      requestedUser.student,
      {
        isDeleted: true,
      },
      { new: true }
    );

    res.status(200).json({ message: "Student has been deleted Successfully!" });
  } catch (err) {
    next(err);
  }
});

// Appointment for coaching //
exports.bookCoachingAppointment = asyncHandler(async (req, res, next) => {
  try {
    const slotTimmings = req.body.time;
    const studentID = req.user.student;

    const newAppointment = new Appointment({
      student: studentID,
      timmings: slotTimmings,
    });
    newAppointment.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        appointments: newAppointment._id,
      },
    });

    const admin = await User.updateMany(
      { role: "admin" },
      {
        $push: { appointments: newAppointment._id },
        $push: {
          notifications: {
            title: "Coaching Appointment for  Student",
            description: "Student has requested for Coaching Appointment",
          },
        },
      }
    );

    res.status(200).json({ message: "Success! Appoinment Created" });
  } catch (err) {
    next(err);
  }
});

exports.searchForJob = asyncHandler(async (req, res, next) => {
  try {
    // matchingAlgo.dealBreaker("startingDate", req, res, next);
    // matchingCriteria.location(req, res, next);
    // matchingCriteria.softSkills(req, res, next)
    // matchingCriteria.hardSkills(req, res, next);
    // matchingCriteria.field(req, res, next);
    // matchingCriteria.jobName(req, res, next);
    // matchingCriteria.startDate(req, res, next);
    // matchingCriteria.lengthOfTheAlternate(req, res, next);
    // matchingCriteria.levelOfEducation(req, res, next);
    // matchingCriteria.frequencyOfApprenticeship(req, res, next);
    // matchingCriteria.ageRange(req, res, next);
    // matchingCriteria.search(req, res, next);
    matchingCriteria.display(req, res, next);
  } catch (err) {
    res.status(400).json({ message: err.message });

    next(err);
  }
});

// GET single Student Profile

exports.GetUser = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      { path: "company" },
      {
        path: "student",
        populate: [
          {
            path: "softSkills",
          },
          {
            path: "hardSkills",
          },
        ],
      },
    ];
    const { type } = req.body;
    const userID = req.user.id;
    const requestedUser = await User.findOne({
      _id: userID,
      type: type,
    }).populate(populateQuery);

    res.status(200).json({
      message: "User has been fetched Successfully!",
      user: requestedUser,
    });
  } catch (err) {
    next(err);
  }
});
// Delete school of Student Profile
exports.DeleteSchool = asyncHandler(async (req, res, next) => {
  try {
    const schoolID = req.params.id;
    const user = await User.findById(req.user.id);
    let student = await Student.findById(user.student);

    await Student.findByIdAndUpdate(
      student._id,
      {
        $pull: { education: { _id: schoolID } },
      },
      { new: true }
    );
    const updated_user = await User.findByIdAndUpdate(req.user.id, {
      student: student._id,
    }).populate("student");
    res.status(200).json({
      message: "School has been deleted Successfully!",
      user: updated_user,
    });
  } catch (err) {
    next(err);
  }
});
// Delete ProfessionalInfo  of Student Profile
exports.DeleteProfessionalInfo = asyncHandler(async (req, res, next) => {
  try {
    const schoolID = req.params.id;
    const user = await User.findById(req.user.id);
    let student = await Student.findById(user.student);

    await Student.findByIdAndUpdate(
      student._id,
      {
        $pull: { professional_profile: { _id: schoolID } },
      },
      { new: true }
    );
    const updated_user = await User.findByIdAndUpdate(req.user.id, {
      student: student._id,
    }).populate("student");
    res.status(200).json({
      message: "professional info has been deleted Successfully!",
      user: updated_user,
    });
  } catch (err) {
    next(err);
  }
});

// get soft skills

exports.GetSkills = asyncHandler(async (req, res, next) => {
  try {
    const { type } = req.body;
    if (type === "Soft Skill") {
      const skills = await Skill.find({
        $and: [
          { skillType: "Soft Skill" },
          {
            isDeleted: false,
          },
        ],
      });
      res
        .status(200)
        .send({ skills: skills, message: "Skills has fetched successfully" });
    } else {
      const skills = await Skill.find({
        $and: [
          { skillType: "Hard Skill" },
          {
            isDeleted: false,
          },
        ],
      });
      res
        .status(200)
        .send({ skills: skills, message: "Skills has fetched successfully" });
    }
  } catch (error) {
    res.status(200).send({ message: error.message });
    next(error);
  }
});

// validate appointment
// Appointment for coaching //
exports.validateAppointment = asyncHandler(async (req, res, next) => {
  try {
    const slotTimmings = req.body.status;
    const jobID = req.params.id;
    const studentID = req.user.student;
    if (slotTimmings === "I am not available at the proposed time") {
      await Appointment.findOneAndUpdate(
        { $and: [{ student: `${studentID}` }, { jobID: `${jobID}` }] },
        { $set: { status: "Disapproved" } },
        {
          new: true,
        }
      );
      res.status(200).json({ message: "Success! Appoinment Disapproved" });
    } else {
      await Appointment.findOneAndUpdate(
        { $and: [{ student: `${studentID}` }, { jobID: `${jobID}` }] },
        { $set: { status: "Approved", timmings: slotTimmings } },
        {
          new: true,
        }
      );
      res.status(200).json({ message: "Success! Appoinment Approved" });
    }
  } catch (err) {
    next(err);
  }
});
