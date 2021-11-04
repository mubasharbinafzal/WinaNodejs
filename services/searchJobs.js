const asyncHandler = require("../middlewares/async")
const moment = require("moment")
const User = require("../models/User")
const Job = require("../models/Job")
const Student = require("../models/Student")
const { Promise } = require("mongoose")

class DealBreaker {
  // Starting Date //
  startingDate = async (user, next) => {
    try {
      var filteredJobs = []
      const student = await Student.findById(user.student)
      const studentStartingDate = moment(
        student.positionSought.startDate,
        "DD-MM-YYYY"
      )

      const jobs = await Job.find({ isDeleted: false })
      jobs.map((item) => {
        const jobDate = moment(item.startDate, "DD-MM-YYYY")
        const result = Math.abs(studentStartingDate.diff(jobDate, "months"))
        if (result <= 4) {
          filteredJobs.push(item)
        }
      })
      return filteredJobs
      // res.status(200).json({ Jobs: filteredJobs });
    } catch (err) {
      next(err)
    }
  }
}

class MatchingCriteria extends DealBreaker {
  // Location //
  //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)

  location = async (user, jobs) => {
    function calcDistance(lat1, lon1, lat2, lon2) {
      var R = 6371 // km
      var dLat = toRad(lat2 - lat1)
      var dLon = toRad(lon2 - lon1)
      var lat1 = toRad(lat1)
      var lat2 = toRad(lat2)

      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) *
          Math.sin(dLon / 2) *
          Math.cos(lat1) *
          Math.cos(lat2)
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      var d = R * c
      return d
    }
    // Converts numeric degrees to radians
    function toRad(Value) {
      return (Value * Math.PI) / 180
    }

    const latitude1 = user.address.latitude
    const longitude1 = user.address.longitude
    const locationFilterArray = []
    jobs.map((job) => {
      const latitude2 = job.location.latitude
      const longitude2 = job.location.longitude

      const result =
        (1 -
          calcDistance(latitude1, longitude1, latitude2, longitude2) * 0.02) *
        5
      return locationFilterArray.push({ id: job.id, score: result })
    })
    return locationFilterArray
  }

  softSkills = async (user, jobs) => {
    const student = await Student.findById(user.student)
    const userSoftSkills = student.softSkills

    const softSkillsArray = []
    var n = 0
    var score = 0

    const result = jobs.filter((job) => {
      n = 0
      userSoftSkills.map((item) => {
        job.softSkills.map((item1) => {
          if (item.toString() == item1.toString()) {
            n++
          }
        })
      })
      if (n == 0) {
        score = 0
      } else if (n == 1) {
        score = 0.5
      } else if (n == 2) {
        score = 0.8
      } else if (n == 3) {
        score = 1
      }
      score = score * 15
      return softSkillsArray.push({ id: job.id, score: score })
    })
    return softSkillsArray
  }

  hardSkills = async (user, jobs) => {
    const student = await Student.findById(user.student)
    const userHardSkills = student.hardSkills

    const hardSkillsArray = []
    var n = 0
    var score = 0

    const result = jobs.filter((job) => {
      n = 0
      userHardSkills.map((item) => {
        job.hardSkills.map((item1) => {
          if (item.toString() == item1.toString()) {
            n++
          }
        })
      })
      if (n == 0) {
        score = 0
      } else if (n == 1) {
        score = 0.5
      } else if (n == 2) {
        score = 0.8
      } else if (n == 3) {
        score = 1
      }
      score = score * 20
      return hardSkillsArray.push({ id: job.id, score: score })
    })
    return hardSkillsArray
  }

  field = async (user, jobs) => {
    const student = await Student.findById(user.student)
    const studentField = student.positionSought.domain

    let score = 0
    let fieldArray = []

    jobs.map((job) => {
      if (job.domain === studentField) {
        score = 1
      } else {
        score = 0
      }
      score = score * 35
      return fieldArray.push({ id: job.id, score: score })
    })
    return fieldArray
  }

  jobName = async (user, jobs) => {
    const student = await Student.findById(user.student)

    const studentPosition = student.positionSought.position.toUpperCase()

    let score = 0
    let jobNameArray = []

    jobs.map((job) => {
      const jobTitle = job.title.toUpperCase()
      const result = studentPosition.localeCompare(jobTitle)
      if (result === 0) {
        score = 1
      } else {
        score = 0
      }
      score = score * 4
      return jobNameArray.push({ id: job.id, score: score })
    })
    return jobNameArray
  }

  // Starting Date //
  startDate = async (user, jobs) => {
    const student = await Student.findById(user.student)
    const studentStartingDate = moment(
      student.positionSought.startDate,
      "MM-DD-YYYY"
    )

    var startDateArray = []
    let score = 0

    jobs.map((job) => {
      const jobDate = moment(job.startDate, "MM-DD-YYYY")
      const result = Math.abs(studentStartingDate.diff(jobDate, "weeks"))
      if (result <= 1) {
        score = 1
      } else if (result > 1 && result <= 2) {
        score = 0.8
      } else if (result > 2 && result <= 4) {
        score = 0.3
      } else if (result > 4) {
        score = 0
      }
      score = score * 5
      return startDateArray.push({ id: job.id, score: score })
    })
    // res.status(200).json({ Jobs: filteredJobs });
    return startDateArray
  }

  lengthOfTheAlternate = async (user, jobs) => {
    const student = await Student.findById(user.student)
    const studentDuration = student.positionSought.duration.split(" ")

    var lengthOfTheAlternateArray = []
    let score = 0

    jobs.map((job) => {
      const jobDuration = job.duration.split(" ")
      const result = studentDuration[0] - jobDuration[0]
      if (result == 0) {
        score = 1
      } else if (result == 1) {
        score = 0.4
      } else if (result > 1) {
        score = 0
      }
      score = score * 5
      return lengthOfTheAlternateArray.push({ id: job.id, score: score })
    })
    return lengthOfTheAlternateArray
  }

  levelOfEducation = async (user, jobs) => {
    const student = await Student.findById(user.student)
    const studentEducation = student.positionSought.levelOfEducation.split(":")
    var levelOfEducationArray = []
    let score = 0
    jobs.map((job) => {
      const jobLevelOfEducation = job.levelOfEducation.split(":")

      const result = studentEducation[0] - jobLevelOfEducation[0]
      if (result == 0) {
        score = 1
      } else if (result != studentEducation[0]) {
        if (
          result + 1 == studentEducation[0] ||
          result - 1 == studentEducation[0]
        ) {
          score = 0.7
        }
        if (
          result + 2 == studentEducation[0] ||
          result - 2 == studentEducation[0]
        ) {
          score = 0.3
        } else {
          score = 0
        }
      }

      score = score * 4
      return levelOfEducationArray.push({ id: job.id, score: score })
    })
    return levelOfEducationArray
  }

  frequencyOfApprenticeship = async (user, jobs) => {
    const student = await Student.findById(user.student)
    const studentAlternationRhythm = student.positionSought.alternationRhythm.toUpperCase()

    var frequencyOfApprenticeshipArray = []
    let score = 0

    jobs.map((job) => {
      const jobAlternationRhythm = job.alternationRhythm.toUpperCase()
      const result = studentAlternationRhythm.localeCompare(
        jobAlternationRhythm
      )
      if (result == 0) {
        score = 1
      } else {
        score = 0
      }
      score = score * 3
      return frequencyOfApprenticeshipArray.push({
        id: job.id,
        score: score,
      })
    })
    return frequencyOfApprenticeshipArray
  }

  ageRange = async (user, jobs) => {
    const student = await Student.findById(user.student)
    const studentDOB = moment(student.positionSought.dateOfBirth, "DD-MM-YYYY")
    const currentDate = moment(new Date())
    const studentAge = Math.abs(studentDOB.diff(currentDate, "years"))

    var ageRangeArray = []
    let score = 0

    jobs.map((job) => {
      const jobAgeRange = job.ageRange
      const splittedjobAgeRange = job.ageRange.split("-")

      if (jobAgeRange == "18-20" || jobAgeRange == "21-24") {
        if (
          studentAge >= splittedjobAgeRange[0] &&
          studentAge <= splittedjobAgeRange[1]
        ) {
          score = 1
        } else {
          score = 0
        }
      } else if (jobAgeRange == "25+") {
        if (studentAge >= 25) {
          score = 1
        } else {
          score = 0
        }
      }

      score = score * 4
      return ageRangeArray.push({
        id: job.id,
        score: score,
      })
    })
    return ageRangeArray
  }

  search = async (req, res, next) => {
    try {
      const user = req.user
      const jobs = await this.startingDate(req.user, next)

      // Filters //
      const locationResult = await this.location(user, jobs)
      const softSkillsResult = await this.softSkills(user, jobs)
      const hardSkillsResult = await this.hardSkills(user, jobs)
      const fieldResult = await this.field(user, jobs)
      const jobNameResult = await this.jobName(user, jobs)
      const startDateResult = await this.startDate(user, jobs)
      const lengthOfTheAlternateResult = await this.lengthOfTheAlternate(
        user,
        jobs
      )
      const levelOfEducationResult = await this.levelOfEducation(user, jobs)
      const frequencyOfApprenticeshipResult = await this.frequencyOfApprenticeship(
        user,
        jobs
      )
      const ageRangeResult = await this.ageRange(user, jobs)

      // console.log(locationResult, "location");
      // console.log(softSkillsResult, "softSkillsResult");
      // console.log(hardSkillsResult, "hardSkillsResult");
      // console.log(fieldResult, "fieldResult");
      // console.log(jobNameResult, "jobNameResult");
      // console.log(startDateResult, "startDateResult");
      // console.log(lengthOfTheAlternateResult, "lengthOfTheAlternateResult");
      // console.log(levelOfEducationResult, "levelOfEducationResult");
      // console.log(
      //   frequencyOfApprenticeshipResult,
      //   "frequencyOfApprenticeshipResult"
      // );
      // console.log(ageRangeResult, "ageRangeResult");

      const newArray = []

      jobs.map((job) => {
        let totalScore = 0
        // Location Filter //
        let locationIndex = locationResult.findIndex((loc) => loc.id === job.id)
        totalScore += locationResult[locationIndex].score / 100
        // Soft Skills Filter //
        let softSkillIndex = softSkillsResult.findIndex(
          (softSkill) => softSkill.id === job.id
        )
        totalScore += softSkillsResult[softSkillIndex].score / 100

        // Hard Skills Filter //
        let hardSkillIndex = hardSkillsResult.findIndex(
          (hardSkill) => hardSkill.id === job.id
        )
        totalScore += hardSkillsResult[hardSkillIndex].score / 100

        // Field Filter //
        let fieldIndex = fieldResult.findIndex((field) => field.id === job.id)
        totalScore += fieldResult[fieldIndex].score / 100

        // Job Name Filter //
        let jobNameIndex = jobNameResult.findIndex(
          (jobName) => jobName.id === job.id
        )
        totalScore += jobNameResult[jobNameIndex].score / 100

        // Start Date Filter //
        let startDateIndex = startDateResult.findIndex(
          (startDate) => startDate.id === job.id
        )
        totalScore += startDateResult[startDateIndex].score / 100

        // Length of the Alternate Filter //
        let lengthOfTheAlternateIndex = lengthOfTheAlternateResult.findIndex(
          (lengthOfTheAlternate) => lengthOfTheAlternate.id === job.id
        )
        totalScore +=
          lengthOfTheAlternateResult[lengthOfTheAlternateIndex].score / 100

        // Level Of Education Filter //
        let levelOfEducationIndex = levelOfEducationResult.findIndex(
          (levelOfEducation) => levelOfEducation.id === job.id
        )
        totalScore += levelOfEducationResult[levelOfEducationIndex].score / 100

        // Frequency of Apprenticeship Filter //
        let frequencyOfApprenticeshipIndex = frequencyOfApprenticeshipResult.findIndex(
          (frequencyOfApprenticeship) => frequencyOfApprenticeship.id === job.id
        )
        totalScore +=
          frequencyOfApprenticeshipResult[frequencyOfApprenticeshipIndex]
            .score / 100

        // Age Range Filter //
        let ageRangeIndex = ageRangeResult.findIndex(
          (ageRange) => ageRange.id === job.id
        )
        totalScore += ageRangeResult[ageRangeIndex].score / 100
        newArray.push({
          jobId: job.id,
          score: totalScore,
        })
        newArray.sort(function (a, b) {
          return b.score - a.score
        })
      })
      return newArray
    } catch (err) {
      next(err)
    }
  }

  display = async (req, res, next) => {
    try {
      let output = []
      const sortedArray = await this.search(req, res, next)
      if (sortedArray !== undefined) {
        await Promise.all(
          sortedArray.map(async (job) => {
            const newJob = await Job.findByIdAndUpdate(job.jobId, {
              score: job.score,
            }).populate("company")

            output.push(newJob)
          })
        )
      }
      res.status(200).json({ jobs: output })
    } catch (err) {
      res.status(200).json({ message: err.message })
      next(err)
    }
  }
}

module.exports = {
  MatchingCriteria,
  DealBreaker,
}
