import { Router } from 'express';
import Errors from 'throw.js';
import fs from 'mz/fs';
import FileUpload from 'express-fileupload';
import sha1 from 'js-sha1';

import Job from "./Job";
import JobStore from "./JobStore";
import UserStore from "./UserStore";
import Authentication from "./Authentication";

const routes = Router();

const jobStore = new JobStore();
const userStore = new UserStore();
const authentication = new Authentication(userStore);

routes.use('/api/client', authentication.clientApiAuth);
routes.use('/api/client', authentication.clientApiRejectUnauthenticated);

/**
 * GET home page
 */
routes.get('/', (req, res) => {
  res.render('index', { title: 'Express Babel' });
});

/**
 * GET /list
 *
 * This is a sample route demonstrating
 * a simple approach to error handling and testing
 * the global error handler. You most certainly want to
 * create different/better error handlers depending on
 * your use case.
 */
routes.get('/list', (req, res, next) => {
  const { title } = req.query;

  if (title == null || title === '') {
    // You probably want to set the response HTTP status to 400 Bad Request
    // or 422 Unprocessable Entity instead of the default 500 of
    // the global error handler (e.g check out https://github.com/kbariotis/throw.js).
    // This is just for demo purposes.
    next(new Error('The "title" parameter is required'));
    return;
  }

  res.render('index', { title });
});

routes.get('/api/debugJobStore', (req, res, next) => {
  res.send(jobStore);
});

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

routes.put('/api/client/createJob', (req, res, next) => {
  if(req.headers["content-type"] !== "application/json") {
    next(new Errors.BadRequest("Expected JSON job specification"));
    return;
  }
  if(!req.body || !req.body.runCommand || !req.body.runZipId) {
    next(new Errors.BadRequest("Missing required job parameter"));
    return;
  }

  // TODO: verify that the specified run artifact exists
  const newJob = new Job(req.body.runCommand, req.body.runZipId);
  jobStore.queueJob(newJob);

  res.json({
    "id": newJob.uid
  });
});

routes.get('/api/worker/getNextJob', (req, res, next) => {
  const nextJob = jobStore.runNextJob();

  if(!nextJob) {
    // TODO: What should this return if there's no pending job?
    next(new Errors.NotFound("No jobs in job queue"));
    return;
  }

  res.json(nextJob);
});

routes.post('/api/worker/jobCompleted', (req, res, next) => {
  if(req.headers["content-type"] !== "application/json") {
    next(new Errors.BadRequest("Expected JSON job specification"));
    return;
  }
  if(!req.body || !req.body.jobId || !req.body.completionState || !req.body.resultZipId) {
    next(new Errors.BadRequest("Missing required parameter"));
    return;
  }

  // TODO: verify that the specified artifact exists
  jobStore.markJobCompleted(req.body.jobId, req.body.completionState, req.body.resultZipId);

  res.json({
    "result": "ok"
  });
});

routes.get('/api/client/job/:jobId', (req, res, next) => {
  const job = jobStore.getJobById(req.params.jobId);

  if(!job) {
    // TODO: What should this return if there's no pending job?
    next(new Errors.NotFound(`No job found with ID ${req.params.jobId}`));
    return;
  }

  res.json(job);
});

export default routes;
