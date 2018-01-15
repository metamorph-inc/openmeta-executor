import express from 'express';
import path from 'path';
import logger from 'morgan';
import bodyParser from 'body-parser';
import Errors from 'throw.js';
import Routes from './routes';

export default function(ignoreJobLabels) {
  const app = express();
  app.disable('x-powered-by');

  // View engine setup
  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'pug');

  app.use(logger('dev', {
    skip: () => app.get('env') === 'test'
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, '../public')));

  // Routes
  app.use('/', Routes(ignoreJobLabels));

  // Catch 404 and forward to error handler
  app.use((req, res, next) => {
    next(new Errors.NotFound("Not Found"));
  });

  // Reply to errors on API endpoints with JSON
  app.use("/api/", (err, req, res, next) => { // eslint-disable-line no-unused-vars
    res
      .status(err.statusCode || 500)
      .send({
        error: err.statusCode || 500,
        message: err.message
      });
  });

  // Error handler
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    res
      .status(err.statusCode || 500)
      .render('error', {
        message: err.message
      });
  });

  return app;
}
