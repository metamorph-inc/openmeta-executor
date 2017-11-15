import Job, { JobState } from "./Job";

class JobStore {
  constructor() {
    this.pendingJobQueue = [];
    this.allJobs = new Map();
    this.allJobs.toJSON = () => { // For debugging, because JSON.stringify doesn't work on Maps by default
      return [...this.allJobs];
    };
  }

  queueJob(newJob) {
    this.allJobs.set(newJob.uid, newJob);
    this.pendingJobQueue.push(newJob);
  }

  runNextJob() {
    const nextJob = this.pendingJobQueue.shift();

    if(nextJob) {
      nextJob.status = JobState.RUNNING;
    }

    return nextJob;
  }

  markJobCompleted(jobId, completionState, resultZipId) {
    const completedJob = this.allJobs.get(jobId);

    if(completedJob) {
      completedJob.status = completionState;
      completedJob.resultZipId = resultZipId;
    }
  }

  getJobById(jobId) {
    return this.allJobs.get(jobId);
  }
}

export default JobStore;
