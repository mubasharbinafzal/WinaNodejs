const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  
  address: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    zip: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
  },

  company_type: {
    type: String,
    enum: ["Startup", "PME", "TPE", "GE", "ETI"],
    required: false,
  },

  siretNumber: {
    type: String,
    required: false,
  },

  website: {
    type: String,
    required: false,
  },

  linkedIn: {
    type: String,
    required: false,
  },

  groupName: {
    type: String,
    required: false,
  },

  availableHours: {
    type: String,
    required: false,
  },

  contactPerson: {
    person: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    positionHeld: {
      type: String,
    },
  },
  notifications: [
    {
      title: String,
      description: String,
      statusNew: { type: Boolean, default: true },
      jobID: {
        type: String,
        required: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  job: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  ],

  isDeleted: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Company", CompanySchema);
