const nodemailer = require("nodemailer");
const crypto = require("crypto");
const async = require("async");
const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Company = require("../models/Company");
const Student = require("../models/Student");

//REGISTER USER API

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
      type: Joi.string().required().optional().allow(""),
      role: Joi.string().optional().allow(""),
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
      email,
      password,
      confirm_password,
      address,
      role,
      phone,
    } = req.body;

    //// Check If Password and Confirm Password are same or not ////
    if (password !== confirm_password) {
      res.status(403).send("Password and Confirm Password are not same");
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
        address,
        password,
        phone,
        type,
      });
      let updateUser;
      if (req.body.type && req.body.type === "student") {
        userobj = new Student({
          general_Presentation: "",
          presentation_Video: "",
          professional_Picture: "",
          professional_networks: "",

          user: user._id,
        });

        await userobj.save();
        updateUser = await User.findByIdAndUpdate(user._id, {
          student: userobj._id,
        }).populate("student");
      } else {
        updateUser = user;
      }
      res
        .status(200)
        .json({ user: updateUser, message: "User is registered successfully" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
    next(err);
  }
});

// Email Verfication for new Registrations //
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  try {
    async.waterfall(
      [
        function (done) {
          crypto.randomBytes(20, function (err, buf) {
            var token = buf.toString("hex");
            done(err, token);
          });
        },
        function (token, done) {
          const email = req.body.email;
          User.findOne(
            {
              email: email,
            },
            function (err, user) {
              if (!user) {
                return res.status(403).send({
                  message: "No account with that email address exists",
                });
              }
              User.findOneAndUpdate(
                { email: email },
                {
                  $set: {
                    verifyEmailToken: token,
                    emailVerificationExpiresIn: Date.now() + 36000000,
                  },
                },
                { new: true },
                function (err) {
                  done(err, token, user);
                }
              );
            }
          );
        },
        function (token, user, done) {
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
            subject: "Verfication Email Request for WINA",
            text:
              "You are receiving this because you (or someone else) have requested to register your account on WINA.\n\n" +
              "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
              "http://" +
              `${process.env.verifyEmail}` +
              "/verifyEmail/" +
              token +
              "\n\n" +
              "If you did not request this, please ignore this email.\n",
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return res.status(400).json({ message: error.message });
            }
            res
              .status(200)
              .json({ message: "Verification Email has been sent" });
          });
        },
      ],
      function (err) {
        if (err) return next(err);
        res.status(200).send("Verfication Email has been sent Successfully");
      }
    );
  } catch (error) {
    res.status(400).send({ message: error.message });

    next(error);
  }
});

exports.verifyEmailProcess = asyncHandler(async (req, res, next) => {
  try {
    async.waterfall(
      [
        function (done) {
          User.findOne(
            {
              verifyEmailToken: req.params.token,
              emailVerificationExpiresIn: {
                $gt: Date.now(),
              },
            },
            async function (err, user) {
              if (!user) {
                return res.status(403).json({
                  message: " token is invalid or has expired",
                });
              } else {
                var user = await User.findOneAndUpdate(
                  {
                    verifyEmailToken: req.params.token,
                  },
                  {
                    $set: {
                      status: "active",
                    },
                  }
                );

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
                  subject: "Success Message",
                  text:
                    "Hello,\n\n" +
                    "You have successfully verified " +
                    user.email +
                    " \n",
                };
                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    return res.status(400).json({ message: error.message });
                  }
                  res.status(200).json({
                    message: "Success! You have successfully registed on WINA",
                  });
                  done(err);
                });
              }
            }
          );
        },
      ],
      function (err) {
        console.log(err, "err");
        res.status(400).json({
          message: err.message,
        });
      }
    );
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
    next(error);
  }
});

//Login User
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const schema = Joi.object().keys({
    email: Joi.string().max(40).required().email(),
    password: Joi.string().min(6).max(255).required(),
  });

  const results = schema.validate(req.body);
  if (results.error) {
    return res.status(400).send(results.error.details[0].message);
  }

  //validating email and password
  if (!email || !password) {
    return res
      .status(400)
      .send({ message: "Please provide email and password" });
  }

  // check if user exists //
  const user = await User.findOne({ email: email }).select("+password");
  if (!user) {
    return res
      .status(400)
      .send({ message: "You are not registered, Please Sign up!" });
  }

  // check if user exists //
  const result = await User.findOne({ email: email, status: "active" }).select(
    "+password"
  );

  if (!result) {
    return res
      .status(400)
      .send({ message: "You haven't verify your email address yet" });
  }
  // Check if password matches

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(400).send({ message: "Password is Invalid" });
  }

  sendTokenResponse(user, 200, res);
});

//Get token from Model create cookie and send response

const sendTokenResponse = async (user, statusCode, res) => {
  //create token
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
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  if (user) {
    const student = await User.findById(user._id).populate(populateQuery);

    res.status(statusCode).cookie("token", token, options).json({
      token: token,
      user: student,
      message: "User Login Successfully",
    });
  } else {
    res.send({ message: "Something went wrong" });
  }
};

// USER Logout
exports.logout = asyncHandler(async (req, res, next) => {
  req.session.destroy(() => {
    req.logOut();
    res.clearCookie("token");
    res.status(200).send("Logged out successfully");
  });
});
