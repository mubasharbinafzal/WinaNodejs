const Joi = require("joi");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Student = require("../models/Student");
const socket = require("../app");

//// Create Job ////
exports.CreateJob = asyncHandler(async (req, res, next) => {
  try {
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.company) {
      const error = new Error("You are not authorized to create Job");
      error.status = 400;
      throw error;
    }
    const companyID = requestedUser.company;

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
      photo,
      description,
    } = req.body;
    if (typeof softSkills === typeof "") {
      // console.log(req.files, "req.file");

      req.body.location = JSON.parse(location);
      req.body.softSkills = JSON.parse(softSkills);
      req.body.hardSkills = JSON.parse(hardSkills);
    }
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
      description: Joi.string(),

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
    let UploadedPicture = {
      image: photo,
      status: "Validated",
    };

    // Creating new student in Database //
    const newJob = new Job({
      title: title,
      status: status,
      description: description,
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
    await Company.findByIdAndUpdate(companyID, {
      $push: { job: newJob._id },
    });

    res.status(200).json({
      message: "Success! Job created.",
      job: newJob,
      user: requestedUser,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
    next(err);
  }
});

//// Edit Job ////
exports.EditJob = asyncHandler(async (req, res, next) => {
  try {
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.company) {
      const error = new Error("You are not authorized to create Job");
      error.status = 400;
      throw error;
    }
    const companyID = requestedUser.company;
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
      description: Joi.string().max(250),

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
            status: "To be Validated",
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
      description,
    } = req.body;

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      {
        title: title,
        domain: domain,
        position: position,
        description: description,
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
    res.status(200).json({ message: "Success! Job Updated", Job: updatedJob });
  } catch (err) {
    res.status(400).json({ message: err.message });

    next(err);
  }
});

// Delete Job
exports.DeleteJob = asyncHandler(async (req, res, next) => {
  try {
    const jobID = req.params.id;
    const userID = req.user.id;
    const user = await User.findById(userID);
    const companyID = user.company;
    const company = await Company.findById(companyID);

    if (company.job) {
      const result = company.job.includes(jobID);
      if (result) {
        await Job.findByIdAndUpdate(jobID, {
          isDeleted: true,
        }).then(async () => {
          const company = await Company.findByIdAndUpdate(companyID, {
            $pull: { job: jobID },
          });
        });
        res.status(200).json({ message: "Job has been deleted successfully" });
      } else {
        res.status(400).json({ message: "You dont own this Job :(" });
      }
    } else {
      res.status(400).json({ message: "You dont own this Job :(" });
    }
  } catch (err) {
    next(err);
  }
});

// GET single Job
exports.GetJob = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
      },
      {
        path: "softSkills",
      },
      {
        path: "hardSkills",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    const jobID = req.params.id;
    const job = await Job.findById(jobID).populate(populateQuery);
    if (job) {
      res.status(200).send({ job: job, message: "Job fetched successfully" });
    }
  } catch (error) {
    res.status(200).send({ message: error });

    next(err);
  }
});

// GET all Jobs
exports.GetJobs = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
      },
      {
        path: "softSkills",
      },
      {
        path: "hardSkills",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    const jobs = await Job.find({ company: requestedUser.company }).populate(
      populateQuery
    );

    if (jobs) {
      res
        .status(200)
        .send({ jobs: jobs, message: "Jobs fetched successfully" });
    }
  } catch (error) {
    res.status(200).send({ message: error });

    next(error);
  }
});

// GET applied Jobs by student
exports.GetStudentAppliedJobs = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
        populate: [
          {
            path: "contactPerson",
            populate: [
              {
                path: "person",
                populate: [
                  {
                    path: "appointments",
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: "softSkills" },
      { path: "hardSkills" },
      {
        path: "student",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    await Job.find()
      .populate(populateQuery)
      .exec(async (err, data) => {
        if (err) {
          res.status(404).send({ message: err.message });
        } else {
          let results = [];

          data.map((dt) => {
            if (dt.student_requests && dt.student_requests.length > 0) {
              let check = dt.student_requests.some(
                (ft) =>
                  `${ft.student}` === `${requestedUser.student}` &&
                  ft.status !== "rejected"
              );
              if (check) {
                results.push(dt);
              }
            }
            return data;
          });
          if (results && results.length > 0) {
            res
              .status(200)
              .send({ jobs: results, message: "Jobs fetched successfully" });
          } else {
            res.status(400).send({ jobs: [], message: "No data found" });
          }
        }
      });
  } catch (error) {
    res.status(200).send({ message: error });

    next(error);
  }
});
// GET rejected Jobs by student
exports.GetStudentRejectedJobs = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
      },
      { path: "softSkills" },
      { path: "hardSkills" },

      {
        path: "student",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    await Job.find()
      .populate(populateQuery)
      .exec(async (err, data) => {
        if (err) {
          res.status(404).send({ message: err.message });
        } else {
          let results = [];
          data.map((dt) => {
            if (dt.company_requests && dt.company_requests.length > 0) {
              let check = dt.company_requests.some(
                (ft) =>
                  `${ft.student}` === `${requestedUser.student}` &&
                  ft.status === "rejected"
              );
              if (check) {
                results.push(dt);
              }
            }
          });
          if (results && results.length > 0) {
            res
              .status(200)
              .send({ jobs: results, message: "Jobs fetched successfully" });
          } else {
            res.status(200).send({ jobs: results, message: "No data found" });
          }
        }
      });
  } catch (error) {
    res.status(200).send({ message: error });

    next(error);
  }
});
// offer accepted by student
exports.OfferDecisionByStudent = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
      },
      {
        path: "softSkills",
      },
      {
        path: "hardSkills",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    const { status } = req.body;
    const JOB_ID = req.params.id;
    const job = await Job.findById(JOB_ID);
    const SENDER_ID = requestedUser.student;
    const RECIEVER_ID = job.company;
    const schema = Joi.object().keys({
      status: Joi.string().valid("requested", "rejected"),
    });
    let results = schema.validate(req.body);
    if (results.error) {
      return res
        .status(400)
        .send({ message: results.error.details[0].message });
    }
    if (status === "requested") {
      await Job.aggregate([
        {
          $project: {
            student_requests: {
              $filter: {
                input: "$student_requests",
                as: "item",
                cond: {
                  $gte: ["$$item.status", "requested"],
                },
              },
            },
          },
        },
      ]).exec(async (err, data) => {
        if (err) {
          res.status(404).send({ message: err.message });
        } else {
          let fill = data.find((fl) => JOB_ID === `${fl._id}`);
          if (
            fill &&
            fill.student_requests &&
            fill.student_requests.length > 0
          ) {
            let check = fill.student_requests.some(
              (sr) => `${sr.student}` === `${SENDER_ID}`
            );
            if (check === true) {
              res
                .status(404)
                .send({ message: "You have already sent a request" });
            } else {
              await Job.findByIdAndUpdate(JOB_ID, {
                $push: {
                  student_requests: {
                    student: SENDER_ID,
                    jobID: JOB_ID,
                    status: req.body.status,
                  },
                },
              });

              await Company.findByIdAndUpdate(
                RECIEVER_ID,
                {
                  $push: {
                    notifications: {
                      title: `student is applied on your job`,
                      jobID: JOB_ID,
                      description: `${requestedUser.firstName} ${" "} ${
                        requestedUser.lastName
                      } is applied on your job`,
                    },
                  },
                },
                { new: true }
              );

              const jobs = await Job.find().populate(populateQuery);
              if (jobs) {
                res.status(200).send({
                  jobs: jobs,
                  message: "Applied on job  successfully",
                });
              }
            }
          } else {
            await Job.findByIdAndUpdate(JOB_ID, {
              $push: {
                student_requests: {
                  student: SENDER_ID,
                  jobID: JOB_ID,
                  status: req.body.status,
                },
              },
            });

            await Company.findByIdAndUpdate(
              RECIEVER_ID,
              {
                $push: {
                  notifications: {
                    title: `student is applied on your job`,
                    jobID: JOB_ID,
                    description: `${requestedUser.firstName} ${" "} ${
                      requestedUser.lastName
                    } is applied on your job`,
                  },
                },
              },
              { new: true }
            );
            const jobs = await Job.find().populate(populateQuery);
            if (jobs) {
              res
                .status(200)
                .send({ jobs: jobs, message: "Applied on job  successfully" });
            }
          }
        }
      });
    } else {
      await Job.aggregate([
        {
          $project: {
            student_requests: {
              $filter: {
                input: "$student_requests",
                as: "item",
                cond: {
                  $gte: ["$$item.status", "rejected"],
                },
              },
            },
          },
        },
      ]).exec(async (err, data) => {
        if (err) {
          res.status(404).send({ message: err.message });
        } else {
          let fill = data.find((fl) => JOB_ID === `${fl._id}`);
          if (
            fill &&
            fill.student_requests &&
            fill.student_requests.length > 0
          ) {
            let check = fill.student_requests.some(
              (sr) => `${sr.student}` === `${SENDER_ID}`
            );
            if (check === true) {
              res
                .status(404)
                .send({ message: "You have already rejected this request" });
            } else {
              await Job.findByIdAndUpdate(JOB_ID, {
                $push: {
                  student_requests: {
                    student: SENDER_ID,
                    jobID: JOB_ID,
                    status: req.body.status,
                  },
                },
              });

              await Company.findByIdAndUpdate(
                RECIEVER_ID,
                {
                  $push: {
                    notifications: {
                      title: `${requestedUser.firstName} ${" "} ${
                        requestedUser.lastName
                      } has rejected  your job`,
                      jobID: JOB_ID,
                      description: `${requestedUser.firstName} ${" "} ${
                        requestedUser.lastName
                      } has rejected your job`,
                    },
                  },
                },
                { new: true }
              );

              const jobs = await Job.find().populate(populateQuery);
              if (jobs) {
                res.status(200).send({
                  jobs: jobs,
                  message: "Rejected job  successfully",
                });
              }
            }
          } else {
            await Job.findByIdAndUpdate(JOB_ID, {
              $push: {
                student_requests: {
                  student: SENDER_ID,
                  jobID: JOB_ID,
                  status: req.body.status,
                },
              },
            });

            await Company.findByIdAndUpdate(
              RECIEVER_ID,
              {
                $push: {
                  notifications: {
                    title: `${requestedUser.firstName} ${" "} ${
                      requestedUser.lastName
                    } has rejected  your job`,
                    jobID: JOB_ID,
                    description: `${requestedUser.firstName} ${" "} ${
                      requestedUser.lastName
                    } has rejected your job`,
                  },
                },
              },
              { new: true }
            );

            const jobs = await Job.find().populate(populateQuery);
            if (jobs) {
              res.status(200).send({
                jobs: jobs,
                message: "Rejected job  successfully",
              });
            }
          }
        }
      });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
    next(error);
  }
});

// recieved offer decision by student
exports.OffersRecievedDecisionByStudent = asyncHandler(
  async (req, res, next) => {
    try {
      const populateQuery = [
        {
          path: "company",
        },
        {
          path: "softSkills",
        },
        {
          path: "hardSkills",
        },
      ];
      const requestedUser = await User.findById(req.user.id);
      if (!requestedUser.type) {
        res.status(400).send({ message: "You are not authorized to get Job" });
      }
      const JOB_ID = req.params.id;
      const job = await Job.findById(JOB_ID);
      const SENDER_ID = requestedUser.student;
      const RECIEVER_ID = job.company;
      const schema = Joi.object().keys({
        status: Joi.string().valid("accepted", "rejected"),
      });
      let results = schema.validate(req.body);
      if (results.error) {
        return res
          .status(400)
          .send({ message: results.error.details[0].message });
      }
      await Job.findOneAndUpdate(
        { _id: JOB_ID },
        { $set: { "company_requests.$[el].status": req.body.status } },
        {
          arrayFilters: [{ "el.student": `${SENDER_ID}` }],
          new: true,
        }
      );
      if (req.body.status === "accepted") {
        await Company.findByIdAndUpdate(
          RECIEVER_ID,
          {
            $push: {
              notifications: {
                title: `${requestedUser.firstName} ${" "} ${
                  requestedUser.lastName
                } has accepted your offer`,
                jobID: JOB_ID,
                description: `${requestedUser.firstName} ${" "} ${
                  requestedUser.lastName
                } has accepted your offer`,
              },
            },
          },
          { new: true }
        );

        const jobs = await Job.find().populate(populateQuery);
        if (jobs) {
          res.status(200).send({
            jobs: jobs,
            message: "Request has been accepted successfully",
          });
        }
      } else {
        await Company.findByIdAndUpdate(
          RECIEVER_ID,
          {
            $push: {
              notifications: {
                title: `${requestedUser.firstName} ${" "} ${
                  requestedUser.lastName
                } has rejected your offer`,
                jobID: JOB_ID,
                description: `${requestedUser.firstName} ${" "} ${
                  requestedUser.lastName
                } has rejected your offer`,
              },
            },
          },
          { new: true }
        );
        const jobs = await Job.find().populate(populateQuery);
        if (jobs) {
          res.status(200).send({
            jobs: jobs,
            message: "Request has been rejected successfully",
          });
        }
      }
    } catch (error) {
      res.status(404).send({ message: error.message });
      next(error);
    }
  }
);

// cancel offer decision by student
exports.CancelOfferDecisionByStudent = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
      },
      {
        path: "softSkills",
      },
      {
        path: "hardSkills",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    const JOB_ID = req.params.id;
    const SENDER_ID = requestedUser.student;
    await Job.findByIdAndUpdate(JOB_ID, {
      $pull: {
        student_requests: {
          $and: [{ status: "requested", student: SENDER_ID }],
        },
      },
    });

    const jobs = await Job.find().populate(populateQuery);
    if (jobs) {
      res.status(200).send({
        // jobs: jobs,
        message: "Request has been deleted successfully",
      });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
    next(error);
  }
});
// cancel offer decision by company
exports.CancelOfferDecisionByCompany = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
      },
      {
        path: "softSkills",
      },
      {
        path: "hardSkills",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    const schema = Joi.object().keys({
      id: Joi.string().required(),
    });
    let results = schema.validate(req.body);
    if (results.error) {
      return res
        .status(400)
        .send({ message: results.error.details[0].message });
    }
    const JOB_ID = req.body.id;
    const SENDER_ID = req.params.id;
    await Job.findByIdAndUpdate(JOB_ID, {
      $pull: {
        company_requests: {
          $and: [{ status: "requested", student: SENDER_ID }],
        },
      },
    });

    const jobs = await Job.find().populate(populateQuery);
    if (jobs) {
      res.status(200).send({
        // jobs: jobs,
        message: "Request has been deleted successfully",
      });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
    next(error);
  }
});
//get all offers requested by company and recieved by specific student
exports.GetCompanyAppliedJobs = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
        populate: [
          {
            path: "contactPerson",
            populate: [
              {
                path: "person",
                populate: [
                  {
                    path: "appointments",
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: "softSkills" },
      { path: "hardSkills" },
      {
        path: "student",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    await Job.find()
      .populate(populateQuery)
      .exec(async (err, data) => {
        if (err) {
          res.status(404).send({ message: err.message });
        } else {
          let results = [];
          data.map((dt) => {
            if (dt.company_requests && dt.company_requests.length > 0) {
              let check = dt.company_requests.some(
                (ft) =>
                  `${ft.student}` === `${requestedUser.student}` &&
                  `${ft.status}` !== "rejected"
              );
              if (check) {
                results.push(dt);
              }
            }
            return data;
          });
          if (results && results.length > 0) {
            res
              .status(200)
              .send({ jobs: results, message: "Jobs fetched successfully" });
          } else {
            res.status(200).send({ jobs: [], message: "No data found" });
          }
        }
      });
  } catch (error) {
    res.status(200).send({ message: error });

    next(error);
  }
});
// GET all student applied Jobs by student
exports.GetStudentAppliedSuccessJobs = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
        path: "student_requests.student",
        populate: [
          {
            path: "softSkills",
          },
          {
            path: "hardSkills",
          },
          {
            path: "user",
          },
        ],
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    let results = await Job.find()
      .select({
        student_requests: {
          $elemMatch: {
            $and: [
              { status: "accepted" },
              {
                student: requestedUser.student,
              },
            ],
          },
        },
      })
      .populate(populateQuery);

    // .populate(populateQuery);
    if (results) {
      res.status(200).send({
        jobs: results,
        message: "Jobs fetched successfully",
      });
    }
  } catch (error) {
    res.status(200).send({ message: error });

    next(error);
  }
});
// GET all student applied Jobs by company
exports.GetAllStudentAppliedJobs = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "student_requests.student",
        populate: [
          {
            path: "softSkills",
          },
          {
            path: "hardSkills",
          },
          {
            path: "user",
          },
        ],
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    const JOB_ID = req.params.id;
    let results = await Job.findOne({ _id: JOB_ID })
      .select({
        _id: true,
        student_requests: {
          $elemMatch: {
            $or: [{ status: "requested" }, { status: "accepted" }],
          },
        },
      })
      .populate(populateQuery);
    if (results) {
      res.status(200).send({
        jobs: results.student_requests,
        message: "Jobs fetched successfully",
      });
    }
  } catch (error) {
    res.status(200).send({ message: error });

    next(error);
  }
});
// GET all company applied Jobs by company
exports.GetAllCompanyAppliedJobs = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company_requests.student",
        populate: [
          {
            path: "softSkills",
          },
          {
            path: "hardSkills",
          },
          {
            path: "user",
          },
        ],
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    const JOB_ID = req.params.id;
    let results = await Job.findOne({ _id: JOB_ID })
      .select({
        company_requests: {
          $elemMatch: {
            $or: [{ status: "requested" }, { status: "accepted" }],
          },
        },
      })
      .populate(populateQuery);
    if (results) {
      res.status(200).send({
        jobs: results.company_requests,
        message: "Jobs fetched successfully",
      });
    }
  } catch (error) {
    res.status(200).send({ message: error });

    next(error);
  }
});
// offer accepted by company
exports.OfferDecisionByCompany = asyncHandler(async (req, res, next) => {
  try {
    const populateQuery = [
      {
        path: "company",
      },
      {
        path: "softSkills",
      },
      {
        path: "hardSkills",
      },
    ];
    const requestedUser = await User.findById(req.user.id);
    if (!requestedUser.type) {
      res.status(400).send({ message: "You are not authorized to get Job" });
    }
    const { status, offerID } = req.body;
    const JOB_ID = offerID;
    const SENDER_ID = requestedUser.company;
    const company = await Company.findById(SENDER_ID);

    const RECIEVER_ID = req.params.id;
    const schema = Joi.object().keys({
      status: Joi.string().valid("requested", "rejected"),
      offerID: Joi.string().required(),
    });
    let results = schema.validate(req.body);
    if (results.error) {
      return res
        .status(400)
        .send({ message: results.error.details[0].message });
    }

    await Job.aggregate([
      {
        $project: {
          company_requests: {
            $filter: {
              input: "$company_requests",
              as: "item",
              cond: {
                $gte: ["$$item.status", status],
              },
            },
          },
        },
      },
    ]).exec(async (err, data) => {
      if (err) {
        res.status(404).send({ message: err.message });
      } else {
        let fill = data.find((fl) => JOB_ID === `${fl._id}`);
        if (fill && fill.company_requests && fill.company_requests.length > 0) {
          let check = fill.company_requests.some(
            (sr) => sr.status === "requested" && `${sr.student}` === RECIEVER_ID
          );
          if (check === true) {
            res
              .status(404)
              .send({ message: "You have already sent a request" });
          } else {
            await Job.findByIdAndUpdate(JOB_ID, {
              $push: {
                company_requests: {
                  student: RECIEVER_ID,
                  jobID: JOB_ID,
                  status: req.body.status,
                },
              },
            });

            await Student.findByIdAndUpdate(
              RECIEVER_ID,
              {
                $push: {
                  notifications: {
                    title: `${company.name} is sent request you on a job`,
                    jobID: JOB_ID,
                    description: `${company.name} is sent request you on a job`,
                  },
                },
              },
              { new: true }
            );
            const jobs = await Job.find().populate(populateQuery);
            if (jobs) {
              res.status(200).send({
                jobs: jobs,
                message: "Request is sent  successfully",
              });
            }
          }
        } else {
          await Job.findByIdAndUpdate(JOB_ID, {
            $push: {
              company_requests: {
                student: RECIEVER_ID,
                jobID: JOB_ID,
                status: req.body.status,
              },
            },
          });

          await Student.findByIdAndUpdate(
            RECIEVER_ID,
            {
              $push: {
                notifications: {
                  title: `${company.name} is sent request you on a job`,
                  jobID: JOB_ID,
                  description: `${company.name} is sent request you on a job`,
                },
              },
            },
            { new: true }
          );
          const jobs = await Job.find().populate(populateQuery);
          if (jobs) {
            res.status(200).send({
              jobs: jobs,
              message: "Request is sent  successfully",
            });
          }
        }
      }
    });
  } catch (error) {
    res.status(404).send({ message: error.message });
    next(error);
  }
});

// recieved offer decision by company
exports.OffersRecievedDecisionByCompany = asyncHandler(
  async (req, res, next) => {
    try {
      const populateQuery = [
        {
          path: "company",
        },
        {
          path: "softSkills",
        },
        {
          path: "hardSkills",
        },
      ];
      const requestedUser = await User.findById(req.user.id);
      if (!requestedUser.type) {
        res.status(400).send({ message: "You are not authorized to get Job" });
      }
      const { status } = req.body;
      const JOB_ID = req.body.id;
      const job = await Job.findById(JOB_ID);
      const SENDER_ID = job.company;
      const company = await Company.findById(SENDER_ID);
      const RECIEVER_ID = req.params.id;
      const schema = Joi.object().keys({
        status: Joi.string().valid("accepted", "rejected"),
        id: Joi.string().required(),
      });
      let results = schema.validate(req.body);
      if (results.error) {
        return res
          .status(400)
          .send({ message: results.error.details[0].message });
      }
      if (status === "accepted") {
        await Job.findOneAndUpdate(
          { _id: JOB_ID },
          { $set: { "student_requests.$[el].status": req.body.status } },
          {
            arrayFilters: [{ "el.student": `${RECIEVER_ID}` }],
            new: true,
          }
        );

        await Student.findByIdAndUpdate(
          RECIEVER_ID,
          {
            $push: {
              notifications: {
                title: `${company.name} has accepted your offer`,
                jobID: JOB_ID,
                description: `${company.name} has accepted your offer`,
              },
            },
          },
          { new: true }
        );
        const jobs = await Job.find().populate(populateQuery);
        if (jobs) {
          res.status(200).send({
            jobs: jobs,
            message: "Request has been accepted successfully",
          });
        }
      } else {
        await Job.findOneAndUpdate(
          { _id: JOB_ID },
          { $set: { "student_requests.$[el].status": req.body.status } },
          {
            arrayFilters: [{ "el.student": `${RECIEVER_ID}` }],
            new: true,
          }
        );

        await Student.findByIdAndUpdate(
          RECIEVER_ID,
          {
            $push: {
              notifications: {
                title: `${company.name} has rejected your offer`,
                jobID: JOB_ID,
                description: `${company.name} has rejected your offer`,
              },
            },
          },
          { new: true }
        );
        const jobs = await Job.find().populate(populateQuery);
        if (jobs) {
          res.status(200).send({
            jobs: jobs,
            message: "Request has been rejected successfully",
          });
        }
      }
    } catch (error) {
      res.status(404).send({ message: error.message });
      next(error);
    }
  }
);
