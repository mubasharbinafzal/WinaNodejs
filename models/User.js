const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// USERS SCHEMA
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: false,
    select: false,
  },
  phone: {
    type: Number,
    required: false,
  },

  address: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    zip: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },

  type: {
    type: String,
    enum: [
      "student",
      "studentConsultant",
      "companyConsultant",
      "company",
      "user",
    ],
    required: false,
    default: "user",
  },

  status: {
    type: String,
    enum: ["active", "deactive"],
    default: "deactive",
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: false,
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: false,
  },

  studentConsultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SudentConsultant",
    required: false,
  },

  companyConsultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompanyConsultant",
    required: false,
  },

  notifications: [
    {
      title: String,
      description: String,
    },
  ],
  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  ],

  isDeleted: {
    type: Boolean,
    default: false,
  },

  invitation: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Invitation",
    required: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  resetPasswordToken: String,
  restPasswordExpires: Date,

  verifyEmailToken: String,
  emailVerificationExpiresIn: Date,
});

//Encrypt Password
UserSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//Check user entered password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
module.exports = mongoose.model("User", UserSchema);
