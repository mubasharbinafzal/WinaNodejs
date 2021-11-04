const mongoose = require("mongoose")

const StudentSchema = new mongoose.Schema({
  general_Presentation: {
    type: String,
    required: false,
  },
  score: {
    type: Number,
    required: false,
    default: 0,
  },
  offer_status: {
    type: String,
    enum: ["accepted", "rejected", "proposal"],
    default: "proposal",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  presentation_Video: {
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

  professional_networks: {
    linkedIn: {
      type: String,
      required: false,
    },
    Behance: {
      type: String,
      required: false,
    },
    Dribble: {
      type: String,
      required: false,
    },
    Github: {
      type: String,
      required: false,
    },
  },

  education: [
    {
      school: {
        type: String,
        required: false,
      },
      image: {
        type: String,
        required: false,
      },
      levelOfEducation: {
        type: String,
        enum: [
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
          "11:Doctorat",
        ],
      },
      end_Date: {
        type: String,
        required: false,
      },
      start_Date: {
        type: String,
        required: false,
      },

      description: {
        type: String,
        required: false,
      },
    },
  ],

  professional_profile: [
    {
      position: {
        type: String,
        required: false,
      },
      image: {
        type: String,
        required: false,
      },
      type: {
        type: String,
        required: false,
      },
      place: {
        type: String,
        required: false,
      },
      position_hold: {
        type: Boolean,
        required: false,
        default: false,
      },
      company: {
        type: String,
        required: false,
      },
      duration: {
        start_date: { type: String, required: false },
        end_date: { type: String, required: false },
      },
      description: {
        type: String,
        required: false,
      },
    },
  ],

  resume: {
    type: String,
    required: false,
  },

  languages: [
    {
      name: { type: String, Required: false },
      skill: {
        type: String,
        enum: ["beginner", "intermediate", "fluent", "native"],
      },
    },
  ],

  positionSought: {
    domain: {
      type: String,
      required: false,
    },

    position: {
      type: String,
      required: false,
    },
    startDate: {
      type: String,
      required: false,
    },
    duration: {
      type: String,
      required: false,
    },
    alternationRhythm: {
      type: String,
      required: false,
    },
    levelOfEducation: {
      type: String,
      enum: [
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
        "11:Doctorat",
      ],
    },
    description: {
      type: String,
      required: false,
    },
    dateOfBirth: {
      type: String,
      required: false,
    },
  },

 

  softSkills: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: false,
    },
  ],
  hardSkills: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: false,
    },
  ],
  notifications: [
    {
      title: String,
      description: String,
      color: { type: String, default: "#ccc" },
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

  isDeleted: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Student", StudentSchema)
