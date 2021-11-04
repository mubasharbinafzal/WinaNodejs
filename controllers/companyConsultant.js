const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const CompanyConsultant = require("../models/CompanyConsultant");

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

    const companyConsultant = await CompanyConsultant.findByIdAndUpdate(
      user.companyConsultant,
      {
        availableHours: req.body.availableHours,
      },
      {
        new: true,
      }
    );
    res.status(200).json({
      message: "Success! Updated",
      CompanyConsultant: companyConsultant,
    });
  } catch (err) {
    next(err);
  }
});
