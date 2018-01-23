import { Router } from 'express';
import Errors from 'throw.js';
import fs from 'mz/fs';
import FileUpload from 'express-fileupload';
import sha1 from 'js-sha1';

import asyncMiddleware from "./utils/AsyncMiddleware.js";
import Job from "./Job";
import JobStore from "./JobStore";
import UserStore from "./UserStore";
import Authentication from "./Authentication";

export default function(ignoreJobLabels) {
  const routes = Router();

  const jobStore = new JobStore(ignoreJobLabels);
  const userStore = new UserStore();
  const authentication = new Authentication(userStore);

  routes.use('/api/client', authentication.clientApiAuth);
  routes.use('/api/client', authentication.clientApiRejectUnauthenticated);

  routes.use('/api/worker', authentication.workerApiRejectInvalidKey);

  /**
   * GET home page
   */
  routes.get('/', (req, res) => {
    res.render('index', { title: 'Express Babel' });
  });

  /**
   * Authenticated ping endpoint--  allows clients and workers to verify that
   * executor server is alive and their credentials are valid
   */
  routes.get(['/api/client/ping', '/api/worker/ping'], (req, res, next) => {
    res.send({"result": "ok"});
  });

  /*routes.get('/api/client/debugJobStore', (req, res, next) => {
    res.send(jobStore);
  });*/

  /**
   * Artifact upload--  used by client to upload workspace and by worker to upload
   * completed results
   */
  routes.use(['/api/client/uploadArtifact', '/api/worker/uploadArtifact'], FileUpload());
  routes.put(['/api/client/uploadArtifact', '/api/worker/uploadArtifact'], (req, res, next) => {
    if(!req.files || !req.files.artifact) {
      next(new Errors.BadRequest("No artifact provided to upload"));
      return;
    }

    const hash = sha1.create();
    hash.update(req.files.artifact.data);
    const hashHex = hash.hex();

    //TODO: make the storage directory configurable or something
    fs.mkdir("./artifacts").catch((err) => {
      if(err.code === "EEXIST") {
        return;
      } else {
        throw err;
      }
    }).then(() => {
      return req.files.artifact.mv("./artifacts/" + hashHex).then(() => {
        res.send({
          hash: hashHex
        });
      });
    }).catch((err) => {
      next(new Error(`An error occurred when saving artifact: ${err.message}`));
    });
  });

  /**
   * Artifact download - used by client to download completed results and by
   * worker to download workspace to operate on
   */
  routes.get(['/api/client/downloadArtifact/:fileHash', '/api/worker/downloadArtifact/:fileHash'], (req, res, next) => {
    //TODO: is there a path injection vulnerability here?
    const options = {
      root: "./artifacts/",
      dotfiles: "deny"
    };
    res.sendFile(req.params.fileHash, options, (err) => {
      if(err) {
        if(err.code === "ENOENT") {
          next(new Errors.NotFound(`No artifact found with hash ${req.params.fileHash}`));
        } else {
          next(new Error(`An error occurred when fetching file: ${err.message}`));
        }
      }
    });
  });

  /**
   * Used by the client to create a new job--  content should be a JSON object,
   * containing the command to run and an artifact ID pointing to the workspace
   * ZIP file.  Returns the job ID.
   */
  routes.put('/api/client/createJob', asyncMiddleware(async (req, res, next) => {
    if(req.headers["content-type"] !== "application/json") {
      next(new Errors.BadRequest("Expected JSON job specification"));
      return;
    }
    if(!req.body || !req.body.runCommand || !req.body.workingDirectory || !req.body.runZipId) {
      next(new Errors.BadRequest("Missing required job parameter "));
      return;
    }

    let labelsString = req.body.labels;
    if(!req.body.labels) {
      // Default to empty string if labels not present
      labelsString = "";
    }
    const tokenizedLabels = labelsString.split("&&").map(str => str.trim()).filter(str => str.length !== 0);

    // TODO: verify that the specified run artifact exists
    const newJob = new Job(req.body.runCommand, req.body.workingDirectory, req.body.runZipId, req.authentication.user, tokenizedLabels);
    await jobStore.queueJob(newJob);

    res.json({
      "id": newJob.uid
    });
  }));

  /**
   * Used by the worker to get the next job to run--  returns a job object as
   * JSON.
   */
  routes.get('/api/worker/getNextJob', asyncMiddleware(async (req, res, next) => {
    let workerLabelsString = req.query.workerLabels;
    if(!req.query.workerLabels) {
      workerLabelsString = "";
    }
    const tokenizedLabels = workerLabelsString.split(",").map(str => str.trim()).filter(str => str.length !== 0);

    const nextJob = await jobStore.runNextJob(tokenizedLabels);

    if(!nextJob) {
      // TODO: What should this return if there's no pending job?
      next(new Errors.NotFound("No jobs in job queue"));
      return;
    }

    res.json(nextJob);
  }));

  /**
   * Used by the worker to mark a job as completed--  content should be a JSON
   * object, containing the job ID, the completion state (either COMPLETED or
   * FAILED), and the artifact ID of the results ZIP.
   */
  routes.post('/api/worker/jobCompleted', asyncMiddleware(async (req, res, next) => {
    if(req.headers["content-type"] !== "application/json") {
      next(new Errors.BadRequest("Expected JSON job specification"));
      return;
    }
    if(!req.body || !req.body.jobId || !req.body.completionState || !req.body.resultZipId) {
      next(new Errors.BadRequest("Missing required parameter"));
      return;
    }

    // TODO: verify that the specified artifact exists
    await jobStore.markJobCompleted(req.body.jobId, req.body.completionState, req.body.resultZipId);

    res.json({
      "result": "ok"
    });
  }));

  /**
   * Used by the client to get information about the job with ID `jobId`.  Returns
   * a job object as JSON.
   */
  routes.get(['/api/client/job/:jobId', '/api/worker/job/:jobId'], asyncMiddleware(async (req, res, next) => {
    const job = await jobStore.getJobById(req.params.jobId);

    if(!job) {
      // TODO: What should this return if there's no pending job?
      next(new Errors.NotFound(`No job found with ID ${req.params.jobId}`));
      return;
    }

    res.json(job);
  }));

  /**
   * Used by the client to cancel the job with ID `jobId`.  Returns a JSON object
   * indicating if the job was successfully cancelled or not.
   */
  routes.post('/api/client/job/:jobId/cancel', asyncMiddleware(async (req, res, next) => {
   const cancelled = await jobStore.cancelJob(req.params.jobId);

   res.json({
     "cancelled": cancelled
   });
  }));

  return routes;
}
