import request from "superagent";
import fs from "mz/fs";
import path from "path";
import unzip from "unzip";
import archiver from "archiver";

class ExecutorClient {
  constructor(serverAddress, serverKey, labels) {
    this.serverAddress = serverAddress;
    this.serverKey = serverKey;
    this.labels = labels;
  }

  async getNextJob() {
    try {
      const res = await request.get(this.serverAddress + 'api/worker/getNextJob')
        .set("openmeta-worker-key", this.serverKey)
        .query({workerLabels: this.labels});
      const newJob = res.body;
      console.log("New job received");
      console.log(newJob);
      return newJob;
    } catch(err) {
      if(err.status && err.status === 404) {
        return null;
      } else {
        throw err;
      }
    }
  }

  async getJobInfo(jobId) {
    try {
      const res = await request.get(this.serverAddress + 'api/worker/job/' + jobId)
        .set("openmeta-worker-key", this.serverKey);
      const newJob = res.body;
      return newJob;
    } catch(err) {
      if(err.status && err.status === 404) {
        return null;
      } else {
        throw err;
      }
    }
  }

  async artifactDownload(artifactId, jobId) {
    //make sure work directory exists
    try {
      await fs.mkdir(path.join(".", "worker"));
    } catch(err) {
      if(err.code !== "EEXIST") {
        throw err;
      }
    }

    const writeStreamPromise = new Promise((resolve, reject) => {
      request.get(this.serverAddress + 'api/worker/downloadArtifact/' + artifactId)
        .set("openmeta-worker-key", this.serverKey)
        .pipe(unzip.Extract({path: path.join(".", "worker", jobId)}))
        .on("close", resolve)
        .on("error", reject);
    });

    await writeStreamPromise;
  }

  async uploadJobResults(job, resultCode) {
    console.log("Compressing results");
    const zipFilePath = await this.createZipFile(job.uid);

    const zipFileHash = await this.uploadZipFile(zipFilePath);


  }

  createZipFile(jobId) {
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
  }

  async uploadZipFile(zipFilePath) {
    console.log("Uploading results");
    console.log(zipFilePath);
    const uploadRes = await request.put(this.serverAddress + "api/worker/uploadArtifact")
      .set("openmeta-worker-key", this.serverKey)
      .attach("artifact", zipFilePath);

    return uploadRes.body.hash;
  }

  async notifyJobCompletion(job, resultCode, zipFileHash) {
    console.log("Informing job server that job is complete");
    const res = await request.post(this.serverAddress + "api/worker/jobCompleted")
      .set("openmeta-worker-key", this.serverKey)
      .send({
        jobId: job.uid,
        completionState: resultCode,
        resultZipId: zipFileHash
      });
  }
}

export default ExecutorClient;
