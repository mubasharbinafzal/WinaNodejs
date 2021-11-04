const mongoose = require("mongoose");

const CompanyConsultantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  video: {
    video: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["None", "Validated", "To be Validated"],
      default: "Validated",
      required: false,
    },
    required: false,
  },

  professional_Picture: {
    image: {
      type: String,
      required: false,
      default: "default.jpg",
    },
    status: {
      type: String,
      enum: ["None", "Validated", "To be Validated"],
      default: "Validated",
      required: false,
    },
    required: false,
  },
  availableHours: {
    type: String,
    required: false,
  },

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

module.exports = mongoose.model("CompanyConsultant", CompanyConsultantSchema);
