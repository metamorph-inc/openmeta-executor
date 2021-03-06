import Chance from "chance";

const JobState = {
  CREATED: 0,
  RUNNING: 1,
  SUCCEEDED: 2,
  FAILED: 3,
  CANCELLED: 4,
  REQUESTING_CANCELLATION: 5
};

class Job {
  constructor(runCommand, workingDirectory, runZipId, owner, labels) {
    this.runCommand = runCommand;
    this.workingDirectory = workingDirectory;
    this.runZipId = runZipId;
    this.owner = owner;
    this.creationTime = new Date();
    this.status = JobState.CREATED;
    this.uid = (new Chance()).guid();
    this.resultZipId = null;
    this.labels = labels;
  }

  /**
   * Takes an object (as stored in the data store) and
   * converts it to a Job instance.
   *
   * @param {object} obj - The object to convert
   * @return {Job} The new job
   */
  static fromSerializedObject(obj) {
    const newJob = new Job();

    newJob.runCommand = obj.runCommand;
    newJob.workingDirectory = obj.workingDirectory;
    newJob.runZipId = obj.runZipId;
    newJob.owner = obj.owner;
    newJob.creationTime = obj.creationTime;
    newJob.status = obj.status;
    newJob.uid = obj.uid;
    newJob.resultZipId = obj.resultZipId;

    if(obj.hasOwnProperty("labels")) {
      newJob.labels = obj.labels;
    } else {
      newJob.labels = [];
    }

    return newJob;
  }

  /**
   * Takes a Job instance and converts it to be stored in
   * the data store.
   */
  toSerializedObject() {
    const newObj = {...this};

    newObj._id = this.uid;

    return newObj;
  }
}

export { JobState };
export default Job;
