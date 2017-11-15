import request from "superagent";
import fs from "mz/fs";
import child_process from "mz/child_process";
import path from "path";
import unzip from "unzip";
import archiver from "archiver";

const JOB_POLL_DELAY = 2*1000;
const ERROR_DELAY = 5*1000;

console.log("Executor worker launched");

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

    console.log("Job completed: success");
    return JobState.SUCCEEDED;
  } catch(err) {
    console.log("Job completed: failed");
    return JobState.FAILED;
  }
};

const createZipFile = (jobId) => {
  const promise = new Promise((resolve, reject) => {
    // create a file to stream archive data to.
    const zipFilePath = path.join(".", "worker", jobId + ".zip");
    var output = fs.createWriteStream(zipFilePath);
    var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');

      resolve(zipFilePath);
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        reject(err);
      } else {
        // throw error
        reject(err);
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      reject(err);
    });

    archive.pipe(output);

    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(path.join(".", "worker", jobId), false);

    archive.finalize();
  });

  return promise;
};

const uploadJobResults = async (job, resultCode) => {
  console.log("Compressing results");
  const zipFilePath = await createZipFile(job.uid);

  console.log("Uploading results");
  const uploadRes = await request.put("http://localhost:8080/api/worker/uploadArtifact")
    .attach("artifact", zipFilePath);

  console.log("Informing job server that job is complete");
  const res = await request.post("http://localhost:8080/api/worker/jobCompleted")
    .send({
      jobId: job.uid,
      completionState: resultCode,
      resultZipId: uploadRes.body.hash
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
    if(err.status && err.status === 404) {
      console.log("No pending jobs; continuing");
      setTimeout(jobPoll, JOB_POLL_DELAY);
    } else {
      console.error(err);
      setTimeout(jobPoll, ERROR_DELAY);
    }
  }
};

setTimeout(jobPoll, JOB_POLL_DELAY);
