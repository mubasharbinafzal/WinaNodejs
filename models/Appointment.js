const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: false,
  },
  jobID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: false,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: false,
  },
  studentConsultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentConsultant",
    required: false,
  },
  companyConsultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompanyConsultant",
    required: false,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Disapproved", "Completed"],
    default: "Pending",
    required: false,
  },
  timmings: [{
    type: Object,
    required: false,
  }],

  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
