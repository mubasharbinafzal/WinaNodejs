const asyncHandler = require("../middlewares/async");
const moment = require("moment");
const User = require("../models/User");
const Job = require("../models/Job");
const Student = require("../models/Student");
const { Promise } = require("mongoose");

class DealBreaker {
  // Starting Date //
  startingDate = async (job, next) => {
    try {
      var filteredStudents = [];
      const jobStartingDate = moment(job.startDate, "DD-MM-YYYY");

      const students = await Student.find({ isDeleted: false });
      students.map((item) => {
        const studentStartingDate = moment(
          item.positionSought.startDate,
          "DD-MM-YYYY"
        );
        const result = Math.abs(
          jobStartingDate.diff(studentStartingDate, "months")
        );
        if (result <= 4) {
          filteredStudents.push(item);
        }
      });
      return filteredStudents;
      // res.status(200).json({ Jobs: filteredJobs });
    } catch (err) {
      next(err);
    }
  };
}

class MatchingCriteria extends DealBreaker {
  // Location //
  //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)

  location = async (job, students) => {
    function calcDistance(lat1, lon1, lat2, lon2) {
      var R = 6371; // km
      var dLat = toRad(lat2 - lat1);
      var dLon = toRad(lon2 - lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) *
          Math.sin(dLon / 2) *
          Math.cos(lat1) *
          Math.cos(lat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d;
    }
    // Converts numeric degrees to radians
    function toRad(Value) {
      return (Value * Math.PI) / 180;
    }

    const latitude1 = job.location.latitude;
    const longitude1 = job.location.longitude;

    const locationFilterArray = [];

    await Promise.all(
      students.map(async (student) => {
        const user = await User.findById(student.user);
        const latitude2 = user.address.latitude;
        const longitude2 = user.address.longitude;

        const result =
          (1 -
            calcDistance(latitude1, longitude1, latitude2, longitude2) * 0.02) *
          5;

        return locationFilterArray.push({ id: student.id, score: result });
      })
    );
    return locationFilterArray;
  };

  softSkills = async (job, students) => {
    const jobSoftSkills = job.softSkills;

    const softSkillsArray = [];
    var n = 0;
    var score = 0;

    const result = students.filter((student) => {
      n = 0;
      jobSoftSkills.map((item) => {
        student.softSkills.map((item1) => {
          if (item.toString() == item1.toString()) {
            n++;
          }
        });
      });
      if (n == 0) {
        score = 0;
      } else if (n == 1) {
        score = 0.5;
      } else if (n == 2) {
        score = 0.8;
      } else if (n == 3) {
        score = 1;
      }
      score = score * 15;
      return softSkillsArray.push({ id: student.id, score: score });
    });
    return softSkillsArray;
  };

  hardSkills = async (job, students) => {
    const jobHardSkills = job.hardSkills;

    const hardSkillsArray = [];
    var n = 0;
    var score = 0;

    const result = students.filter((student) => {
      n = 0;
      jobHardSkills.map((item) => {
        student.hardSkills.map((item1) => {
          if (item.toString() == item1.toString()) {
            n++;
          }
        });
      });
      if (n == 0) {
        score = 0;
      } else if (n == 1) {
        score = 0.5;
      } else if (n == 2) {
        score = 0.8;
      } else if (n == 3) {
        score = 1;
      }
      score = score * 20;
      return hardSkillsArray.push({ id: student.id, score: score });
    });
    return hardSkillsArray;
  };

  field = async (job, students) => {
    const jobField = job.domain;

    let score = 0;
    let fieldArray = [];

    students.map((student) => {
      if (student.positionSought.domain === jobField) {
        score = 1;
      } else {
        score = 0;
      }
      score = score * 35;
      return fieldArray.push({ id: student.id, score: score });
    });
    return fieldArray;
  };

  jobName = async (job, students) => {
    const jobPosition = job.title.toUpperCase();

    let score = 0;
    let jobNameArray = [];

    students.map((student) => {
      const studentTitle = student.positionSought.position.toUpperCase();
      const result = jobPosition.localeCompare(studentTitle);
      if (result === 0) {
        score = 1;
      } else {
        score = 0;
      }
      score = score * 4;
      return jobNameArray.push({ id: student.id, score: score });
    });
    return jobNameArray;
  };

  // Starting Date //
  startDate = async (job, students) => {
    const jobStartingDate = moment(job.startDate, "DD-MM-YYYY");

    var startDateArray = [];
    let score = 0;

    students.map((student) => {
      const studentDate = moment(
        student.positionSought.startDate,
        "DD-MM-YYYY"
      );
      const result = Math.abs(jobStartingDate.diff(studentDate, "weeks"));
      if (result <= 1) {
        score = 1;
      } else if (result > 1 && result <= 2) {
        score = 0.8;
      } else if (result > 2 && result <= 4) {
        score = 0.3;
      } else if (result > 4) {
        score = 0;
      }
      score = score * 5;
      return startDateArray.push({ id: student.id, score: score });
    });
    // res.status(200).json({ Jobs: filteredJobs });
    return startDateArray;
  };

  lengthOfTheAlternate = async (job, students) => {
    const jobDuration = job.duration.split(" ");

    var lengthOfTheAlternateArray = [];
    let score = 0;

    students.map((student) => {
      const studentDuration = student.positionSought.duration.split(" ");
      const result = jobDuration[0] - studentDuration[0];
      if (result == 0) {
        score = 1;
      } else if (result == 1) {
        score = 0.4;
      } else if (result > 1) {
        score = 0;
      }
      score = score * 5;
      return lengthOfTheAlternateArray.push({ id: student.id, score: score });
    });
    return lengthOfTheAlternateArray;
  };

  levelOfEducation = async (job, students) => {
    const jobEducation = job.levelOfEducation.split(":");
    var levelOfEducationArray = [];
    let score = 0;
    students.map((student) => {
      const studentLevelOfEducation = student.positionSought.levelOfEducation.split(
        ":"
      );

      const result = jobEducation[0] - studentLevelOfEducation[0];
      if (result == 0) {
        score = 1;
      } else if (result != jobEducation[0]) {
        if (result + 1 == jobEducation[0] || result - 1 == jobEducation[0]) {
          score = 0.7;
        }
        if (result + 2 == jobEducation[0] || result - 2 == jobEducation[0]) {
          score = 0.3;
        } else {
          score = 0;
        }
      }

      score = score * 4;
      return levelOfEducationArray.push({ id: student.id, score: score });
    });
    return levelOfEducationArray;
  };

  frequencyOfApprenticeship = async (job, students) => {
    const jobAlternationRhythm = job.alternationRhythm.toUpperCase();

    var frequencyOfApprenticeshipArray = [];
    let score = 0;

    students.map((student) => {
      const studentAlternationRhythm = student.positionSought.alternationRhythm.toUpperCase();
      const result = jobAlternationRhythm.localeCompare(
        studentAlternationRhythm
      );
      if (result == 0) {
        score = 1;
      } else {
        score = 0;
      }
      score = score * 3;
      return frequencyOfApprenticeshipArray.push({
        id: student.id,
        score: score,
      });
    });
    return frequencyOfApprenticeshipArray;
  };

  ageRange = async (job, students) => {
    const jobAgeRange = job.ageRange;
    const splittedjobAgeRange = job.ageRange.split("-");

    var ageRangeArray = [];
    let score = 0;

    students.map((student) => {
      const studentDOB = moment(student.positionSought.dateOfBirth, "DD-MM-YYYY");
      const currentDate = moment(new Date());
      const studentAge = Math.abs(studentDOB.diff(currentDate, "years"));

      if (jobAgeRange == "18-20" || jobAgeRange == "21-24") {
        if (
          studentAge >= splittedjobAgeRange[0] &&
          studentAge <= splittedjobAgeRange[1]
        ) {
          score = 1;
        } else {
          score = 0;
        }
      } else if (jobAgeRange == "25+") {
        if (studentAge >= 25) {
          score = 1;
        } else {
          score = 0;
        }
      }

      score = score * 4;
      return ageRangeArray.push({
        id: student.id,
        score: score,
      });
    });
    return ageRangeArray;
  };

  search = async (req, res, next) => {
    try {
      const job = await Job.findById(req.params.id);
      const students = await this.startingDate(job, next);

      // Filters //
      const locationResult = await this.location(job, students);
      const softSkillsResult = await this.softSkills(job, students);
      const hardSkillsResult = await this.hardSkills(job, students);
      const fieldResult = await this.field(job, students);
      const jobNameResult = await this.jobName(job, students);
      const startDateResult = await this.startDate(job, students);
      const lengthOfTheAlternateResult = await this.lengthOfTheAlternate(
        job,
        students
      );
      const levelOfEducationResult = await this.levelOfEducation(job, students);
      const frequencyOfApprenticeshipResult = await this.frequencyOfApprenticeship(
        job,
        students
      );
      const ageRangeResult = await this.ageRange(job, students);

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

      const newArray = [];

      students.map((student) => {
        let totalScore = 0;
        // Location Filter //
        let locationIndex = locationResult.findIndex(
          (loc) => loc.id === student.id
        );
        totalScore += locationResult[locationIndex].score / 100;
        // Soft Skills Filter //
        let softSkillIndex = softSkillsResult.findIndex(
          (softSkill) => softSkill.id === student.id
        );
        totalScore += softSkillsResult[softSkillIndex].score / 100;

        // Hard Skills Filter //
        let hardSkillIndex = hardSkillsResult.findIndex(
          (hardSkill) => hardSkill.id === student.id
        );
        totalScore += hardSkillsResult[hardSkillIndex].score / 100;

        // Field Filter //
        let fieldIndex = fieldResult.findIndex(
          (field) => field.id === student.id
        );
        totalScore += fieldResult[fieldIndex].score / 100;

        // Job Name Filter //
        let jobNameIndex = jobNameResult.findIndex(
          (jobName) => jobName.id === student.id
        );
        totalScore += jobNameResult[jobNameIndex].score / 100;

        // Start Date Filter //
        let startDateIndex = startDateResult.findIndex(
          (startDate) => startDate.id === student.id
        );
        totalScore += startDateResult[startDateIndex].score / 100;

        // Length of the Alternate Filter //
        let lengthOfTheAlternateIndex = lengthOfTheAlternateResult.findIndex(
          (lengthOfTheAlternate) => lengthOfTheAlternate.id === student.id
        );
        totalScore +=
          lengthOfTheAlternateResult[lengthOfTheAlternateIndex].score / 100;

        // Level Of Education Filter //
        let levelOfEducationIndex = levelOfEducationResult.findIndex(
          (levelOfEducation) => levelOfEducation.id === student.id
        );
        totalScore += levelOfEducationResult[levelOfEducationIndex].score / 100;

        // Frequency of Apprenticeship Filter //
        let frequencyOfApprenticeshipIndex = frequencyOfApprenticeshipResult.findIndex(
          (frequencyOfApprenticeship) =>
            frequencyOfApprenticeship.id === student.id
        );
        totalScore +=
          frequencyOfApprenticeshipResult[frequencyOfApprenticeshipIndex]
            .score / 100;

        // Age Range Filter //
        let ageRangeIndex = ageRangeResult.findIndex(
          (ageRange) => ageRange.id === student.id
        );
        totalScore += ageRangeResult[ageRangeIndex].score / 100;

        newArray.push({
          studentId: student.id,
          score: totalScore,
        });
        newArray.sort(function (a, b) {
          return b.score - a.score;
        });
      });

      return newArray;
    } catch (err) {
      res.status(404).send({ message: err.message });
      next(err.message);
    }
  };

  display = async (req, res, next) => {
    try {
      let output = [];
      const sortedArray = await this.search(req, res, next);

      if (sortedArray !== undefined) {
        await Promise.all(
          sortedArray.map(async (student) => {
            const result = await Student.findByIdAndUpdate(student.studentId, {
              score: student.score,
            }).populate("user");
            output.push(result);
          })
        );
        res.status(200).json({ students: output });
      }
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  MatchingCriteria,
  DealBreaker,
};
