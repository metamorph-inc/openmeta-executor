import Job from "./Job";

class JobStore {
  constructor() {
    this.pendingJobQueue = [
      new Job("echo Hi"),
      new Job("ls -la")
    ];
  }
}

export default JobStore;
