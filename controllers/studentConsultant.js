const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const StudentConsultant = require("../models/StudentConsultant");

//// Register User Profile ////

exports.editInfo = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Validation
    const schema = Joi.object().keys({
      availableHours: Joi.array().items({
        day: Joi.string().valid(
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ),
        hours: Joi.array(),
      }),
    });
    const results = schema.validate(req.body);
    if (results.error) {
      return res.status(400).send(results.error.details[0].message);
    }

    const studentConsultant = await StudentConsultant.findByIdAndUpdate(
      user.studentConsultant,
      {
        availableHours: req.body.availableHours,
      },
      {
        new: true,
      }
    );
    res.status(200).json({
      message: "Success! Updated",
      studentConsultant: studentConsultant,
    });
  } catch (err) {
    next(err);
  }
});
