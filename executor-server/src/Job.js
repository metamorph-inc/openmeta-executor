import Chance from "chance";

const JobState = {
  CREATED: 0,
  RUNNING: 1,
  SUCCEEDED: 2,
  FAILED: 3,
  CANCELLED: 4
};

class Job {
  constructor(runCommand, runZipId) {
    this.runCommand = runCommand;
    this.runZipId = runZipId;
    this.creationTime = new Date();
    this.status = JobState.CREATED;
    this.uid = (new Chance()).guid();
    this.resultZipId = null;
  }
}

export { JobState };
export default Job;
