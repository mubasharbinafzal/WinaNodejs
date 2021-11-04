const mongoose = require("mongoose")

const SkillSchema = new mongoose.Schema({
  skillField: {
    type: String,
    required: false,
  },
  skillType: {
    type: String,
    enum: ["Soft Skill", "Hard Skill"],
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
})

module.exports = mongoose.model("Skill", SkillSchema)
