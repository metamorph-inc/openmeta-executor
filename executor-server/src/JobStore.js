import Datastore from "nedb";

import Job, { JobState } from "./Job";

class JobStore {
  constructor() {
    this.db = new Datastore({ filename: 'jobs.nedb', autoload: true });

    this.pendingJobQueue = [];
    this.allJobs = new Map();
    this.allJobs.toJSON = () => { // For debugging, because JSON.stringify doesn't work on Maps by default
      return [...this.allJobs];
    };
  }

  queueJob(newJob) {
    const promise = new Promise((resolve, reject) => {
      this.db.insert(newJob.toSerializedObject(), (err, newDoc) => {
        if(err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return promise;
  }

  runNextJob() {
    //HACK: 'this' gets rebound in 'exec' callback--  shouldn't even be
    //      possible with arrow functions?
    const self = this;

    const promise = new Promise((resolve, reject) => {
      this.db.find({ status: JobState.CREATED })
        .sort({creationTime: 1})
        .exec(function(err, docs) {
          if(err) {
            reject(err);
          } else {
            if(docs.length === 0) {
              resolve(null);
            } else {
              const nextJob = docs[0];
              nextJob.status = JobState.RUNNING;

              self.db.update({ _id: nextJob._id }, nextJob, (err) => {
                if(err) {
                  reject(err);
                } else {
                  resolve(Job.fromSerializedObject(nextJob));
                }
              });
            }
          }
        });
    });

    return promise;
  }

  markJobCompleted(jobId, completionState, resultZipId) {
    const promise = new Promise((resolve, reject) => {
      this.db.update({ _id: jobId },
        { $set: { status: completionState, resultZipId: resultZipId}},
        (err) => {
          if(err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });

    return promise;
  }

  async cancelJob(jobId) {
    const job = await this.getJobById(jobId);

    if(job !== null) {
      let cancelled = false;

      if(job.status === JobState.CREATED) {
        await this.markJobCompleted(jobId, JobState.CANCELLED, null);
        cancelled = true;
      }
      // TODO: handle cancellation of jobs in progress (RUNNING state)
      return cancelled;
    } else {
      return false;
    }
  }

  getJobById(jobId) {
    const promise = new Promise((resolve, reject) => {
      this.db.find({ _id: jobId }, (err, docs) => {
        if(err) {
          reject(err);
        } else {
          if(docs.length === 0) {
            resolve(null);
          } else if(docs.length === 1) {
            resolve(Job.fromSerializedObject(docs[0]));
          } else {
            // This shouldn't be possible (query by key should never return more
            // than one object), but handle it just in case
            reject(new Error("Too many jobs returned from query"));
          }
        }
      });
    });

    return promise;
  }
}

export default JobStore;
