const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Company = require("../models/Company");
const Student = require("../models/Student");

const Appointment = require("../models/Appointment");
const matchingAlgo = require("../services/searchStudents");

var matchingCriteria = new matchingAlgo.MatchingCriteria();
var dealBreaker = new matchingAlgo.DealBreaker();

// Register Company

exports.register = asyncHandler(async (req, res, next) => {
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
      name: Joi.string().max(250).required(),
      address: address_object.required(),
      company_type: Joi.string().valid("Startup", "PME", "TPE", "GE", "ETI"),
      siretNumber: Joi.string().required(),
      website: Joi.string().required().optional().allow(""),
      groupName: Joi.string().required().optional().allow(""),
      linkedIn: Joi.string().required().optional().allow(""),
      type: Joi.string().required().optional().allow(""),

      contactPerson: Joi.object().keys({
        firstName: Joi.string().max(250).required(),
        lastName: Joi.string().max(250).required(),
        email: Joi.string().email().required(),
        positionHeld: Joi.string().required(),
        phone: Joi.string()
          .max(10)
          .pattern(/^[0-9]+$/)
          .required(),

        password: Joi.string().min(6).max(255).required(),
        confirm_password: Joi.string().min(6).max(255).required(),
      }),
    });
    // Storing Error Responses in Result //
    const results = schema.validate(req.body);

    if (results.error) {
      return res
        .status(400)
        .send({ message: results.error.details[0].message });
    }

    const {
      name,
      company_type,
      address,
      siretNumber,
      website,
      groupName,
      linkedIn,
      type,
      contactPerson: {
        firstName,
        lastName,
        email,
        password,
        confirm_password,
        phone,
        positionHeld,
      },
    } = req.body;
    //// Check If Password and Confirm Password are same or not ////
    if (password !== confirm_password) {
      res
        .status(403)
        .send({ message: "Password and Confirm Password are not same" });
    }

    //// Check If user exist with this Email or not ////
    const result = await User.findOne({ email: email });
    if (result) {
      res
        .status(404)
        .send({ message: "User already registered with this Email Address" });
    } else {
      // Saving User in DataBase

      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        type,
      });
      const company = await Company.create({
        name,
        company_type,
        address,
        siretNumber,
        website,
        groupName,
        linkedIn,
        contactPerson: {
          person: user._id,
          positionHeld,
        },
      });
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: { company: company._id },
        },
        { new: true }
      );

      res.status(200).json({
        user: updatedUser,
        message: "User is registered successfully",
      });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
    next(err);
  }
});
// Edit Company
exports.editCompany = asyncHandler(async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id);
    let companyID = user.company;
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
    res
      .status(200)
      .json({ message: "Company Updated Successfully!", company: company });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Company
exports.deleteCompany = asyncHandler(async (req, res, next) => {
  try {
    const userID = req.user.id;
    const requestedUser = await User.findById(userID);
    await Company.findByIdAndUpdate(
      requestedUser.company,
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

// Request for coaching Appointment
exports.bookCoachingAppointment = asyncHandler(async (req, res, next) => {
  try {
    const slotTimmings = req.body.time;
    const StudentID = req.params.id;
    const jobID = req.body.id;
    let userID = await Student.findById(StudentID);

    const companyId = req.user.company;

    let results = await Appointment.find({
      $and: [{ student: StudentID }, { jobID: jobID }],
    });
    if (results && results.length) {
      res.status(400).json({ message: "Appointment is already existed" });
    } else {
      const newAppointment = new Appointment({
        company: companyId,
        student: StudentID,
        timmings: slotTimmings,
        jobID: jobID,
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
              title: "Coaching Appointment for  Company",
              description: "Company has requested for Coaching Appointment",
            },
          },
        }
      );
      const student = await User.findByIdAndUpdate(
        { _id: `${userID.user}` },
        {
          $push: {
            appointments: newAppointment._id,
            notifications: {
              title: "Company has book  Appointments",
              description:
                "Company has book  Appointments,please validate one of it",
            },
          },
        },
        { new: true }
      );

      res.status(200).json({ message: "Success! Appoinment Created" });
    }
  } catch (err) {
    next(err);
  }
});

exports.searchForStudents = asyncHandler(async (req, res, next) => {
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
    next(err);
  }
});
