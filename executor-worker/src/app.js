import request from "superagent";
import fs from "mz/fs";
import child_process from "mz/child_process";
import path from "path";
import unzip from "unzip";

const JOB_POLL_DELAY = 2*1000;

console.log("Job server launched"); //eslint-disable-line no-console

const JobState = {
  CREATED: 0,
  RUNNING: 1,
  SUCCEEDED: 2,
  FAILED: 3,
  CANCELLED: 4
};

const artifactDownload = async (artifactId, jobId) => {
  //make sure work directory exists
  try {
    await fs.mkdir(path.join(".", "worker"));
  } catch(err) {
    if(err.code !== "EEXIST") {
      throw err;
    }
  }

  const writeStreamPromise = new Promise((resolve, reject) => {
    request.get('http://localhost:8080/api/client/downloadArtifact/' + artifactId)
      .pipe(unzip.Extract({path: path.join(".", "worker", jobId)}))
      .on("close", resolve)
      .on("error", reject);
  });

  await writeStreamPromise;
};

const executeJob = async (job) => {
  //TODO: do something fancier with output redirection, and support termination
  //  of jobs in progress
  //TODO: is this cross-platform?
  let runCommand = `${job.runCommand} > stdout.log 2>&1`;

  console.log("Launching subprocess");
  try {
    const result = await child_process.exec(runCommand, {
      cwd: path.join(".", "worker", job.uid)
    });

    return JobState.SUCCEEDED;
  } catch(err) {
    return JobState.FAILED;
  }
};

const uploadJobResults = async (job, resultCode) => {
  const res = await request.post("http://localhost:8080/api/worker/jobCompleted")
    .send({
      jobId: job.uid,
      completionState: resultCode,
      resultZipId: "test"
    });
};

const jobPoll = async () => {
  console.log("Timer called"); //eslint-disable-line no-console

  try {
    const res = await request.get('http://localhost:8080/api/worker/getNextJob');
    const newJob = res.body;
    console.log("New job received");
    console.log(res.body);

    await artifactDownload(newJob.runZipId, newJob.uid);
    console.log("Downloaded and extracted artifacts for ", newJob.uid);
    const jobResult = await executeJob(newJob);
    await uploadJobResults(newJob, jobResult);
    setTimeout(jobPoll, JOB_POLL_DELAY);
  } catch(err) {
    if(err.status === 404) {
      console.log("No pending jobs; continuing");
      setTimeout(jobPoll, JOB_POLL_DELAY);
    } else {
      console.error(err);
    }
  }
};

setTimeout(jobPoll, JOB_POLL_DELAY);
