const JOB_POLL_DELAY = 2*1000;
const ERROR_DELAY = 5*1000;
const RETRY_COUNT = 5;

import child_process from "mz/child_process";
import path from "path";
import JobState from "./JobState";

class WorkerStateMachine {
  constructor(executorClient) {
    this.executorClient = executorClient;
    this.currentState = null;
  }

  async run() {
    this.currentState = new PollingForJobsState(this);
    await this.currentState.enter();
  }

  async transition(nextState, enterArgument) {
    await this.currentState.exit();
    //TODO: Should we retain state instances?
    this.currentState = new nextState(this);
    await this.currentState.enter(enterArgument);
  }
}

export default WorkerStateMachine;

class State {
  constructor(stateMachine) {
    this.stateMachine = stateMachine;
  }

  async enter(arg) {
    // Default implementation does nothing
  }

  async exit() {
    // Default implementation does nothing
  }
}

class PollingForJobsState extends State {
  constructor(stateMachine) {
    super(stateMachine);

    this.timer = null;
  }

  async enter(arg) {
    this.timer = setTimeout(this.pollForJobs.bind(this), 0);
  }

  async exit() {
    if(this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async pollForJobs() {
    try {
      console.log("Polling for jobs...");
      const nextJob = await this.stateMachine.executorClient.getNextJob();

      if(nextJob == null) {
        this.timer = setTimeout(this.pollForJobs.bind(this), JOB_POLL_DELAY);
      } else {
        this.stateMachine.transition(FetchingWorkingDirectoryZipState, nextJob);
      }
    } catch(err) {
      console.error(err);
      this.timer = setTimeout(this.pollForJobs.bind(this), ERROR_DELAY);
    }
  }
}

class FetchingWorkingDirectoryZipState extends State {
  constructor(stateMachine) {
    super(stateMachine);
  }

  async enter(job) {
    this.job = job;
    this.timer = setTimeout(this.fetchWorkingDirectory.bind(this), 0);
    this.retries = 0;
  }

  async exit() {
    if(this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async fetchWorkingDirectory() {
    try {
      await this.stateMachine.executorClient.artifactDownload(this.job.runZipId, this.job.uid);
      this.stateMachine.transition(ExecutingJobState, this.job);
    } catch(err) {
      console.error(err);
      if(this.retries < RETRY_COUNT) {
        this.timer = setTimeout(this.fetchWorkingDirectory.bind(this), ERROR_DELAY);
        this.retries++;
      } else {
        console.log("Reached maximum retry count when fetching working directory");
        this.stateMachine.transition(PollingForJobsState);
      }
    }
  }
}

class ExecutingJobState extends State {
  constructor(stateMachine) {
    super(stateMachine);
  }

  async enter(job) {
    this.job = job;
    //TODO: Poll for job cancellation
    const result = await this.executeJob(job);
    this.stateMachine.transition(CreatingResultsZipState, {job: this.job, result: result});
  }

  async executeJob(job) {
    //TODO: do something fancier with output redirection, and support termination
    //  of jobs in progress
    //TODO: is this cross-platform?
    let runCommand = `${job.runCommand} > stdout.log 2>&1`;

    console.log("Launching subprocess");
    try {
      const result = await child_process.exec(runCommand, {
        cwd: path.join(".", "worker", job.uid, job.workingDirectory)
      });

      console.log("Job completed: success");
      return JobState.SUCCEEDED;
    } catch(err) {
      console.log("Job completed: failed");
      return JobState.FAILED;
    }
  }
}

class CreatingResultsZipState extends State {
  constructor(stateMachine) {
    super(stateMachine);
  }

  async enter(args) {
    try {
      args.zipFilePath = await this.stateMachine.executorClient.createZipFile(args.job.uid);
      this.stateMachine.transition(UploadingResultsZipState, args);
    } catch(err) {
      console.log("An error occurred while creating results zip");
      console.error(err);
      this.stateMachine.transition(PollingForJobsState);
    }
  }
}

class UploadingResultsZipState extends State {
  constructor(stateMachine) {
    super(stateMachine);
  }

  async enter(args) {
    this.args = args;
    this.timer = setTimeout(this.uploadResultsZip.bind(this), 0);
    this.retries = 0;
  }

  async exit() {
    if(this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async uploadResultsZip() {
    try {
      this.args.zipFileHash = await this.stateMachine.executorClient.uploadZipFile(this.args.zipFilePath);
      this.stateMachine.transition(NotifyingJobCompletionState, this.args);
    } catch(err) {
      console.error(err);
      if(this.retries < RETRY_COUNT) {
        this.timer = setTimeout(this.uploadResultsZip.bind(this), ERROR_DELAY);
        this.retries++;
      } else {
        console.log("Reached maximum retry count when uploading result zip");
        this.stateMachine.transition(PollingForJobsState);
      }
    }
  }
}

class NotifyingJobCompletionState extends State {
  constructor(stateMachine) {
    super(stateMachine);
  }

  async enter(args) {
    this.args = args;
    this.timer = setTimeout(this.notifyJobCompletion.bind(this), 0);
    this.retries = 0;
  }

  async exit() {
    if(this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async notifyJobCompletion() {
    try {
      console.log(this.args);
      await this.stateMachine.executorClient.notifyJobCompletion(this.args.job, this.args.result, this.args.zipFileHash);
      this.stateMachine.transition(PollingForJobsState, this.args);
    } catch(err) {
      console.error(err);
      if(this.retries < RETRY_COUNT) {
        this.timer = setTimeout(this.notifyJobCompletion.bind(this), ERROR_DELAY);
        this.retries++;
      } else {
        console.log("Reached maximum retry count when posting job completion");
        this.stateMachine.transition(PollingForJobsState);
      }
    }
  }
}
