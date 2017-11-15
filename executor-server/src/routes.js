import { Router } from 'express';
import fs from 'mz/fs';
import FileUpload from 'express-fileupload';
import sha1 from 'js-sha1';

import JobStore from "./JobStore";

const routes = Router();

const jobStore = new JobStore();

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
      next(new Error(`An error occurred when fetching file: ${err.message}`));
    }
  });
});

export default routes;
