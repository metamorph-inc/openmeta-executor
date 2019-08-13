This script will walk through the process of setting up and running a job using the executor.

1. Create your job definition
2. Upload it to the blob
3. Create a job on the executor
4. Poll
5. Retrieve the results


## Create your job definition
A job definition consists of a set of files needed to run the job. One file is a job descriptor required by the executor framework (`executor_config.json`), while the other files will be specific to the job that you're running.

`executor_config.json` defines the following fields:

- *cmd*: the shell command to run on the executor
- *args*: an array of the parameters to be used with the shell command
- *resultArtifacts*: an array of result filter definitions

**executor_config.json:**
```json
{
	"cmd": "echo",
	"args": ["some sample text to be written to file to be written to job_stdout.txt"],
	"resultArtifacts": [
		{
			"name": "all",
			"resultPatterns": []
		}
    ]
}
```

Create a ZIP archive with this file, along with any other files needed to successfully run the command specified.


## Upload the job ZIP to the blob
```console
curl -X POST --data-binary '@jobdefinition.zip' 'http://104.197.75.234:8888/rest/blob/createFile/jobdefinition.zip'
```

This will yield a result like this:
```json
{
  "39aa77396352b2b19c8cab7450b06791a8652e6e": {
    "name": "executor_config.json.zip",
    "size": 278,
    "mime": "application/zip",
    "isPublic": false,
    "tags": [],
    "content": "f9d5a93b1e76a5ead51d7762c9520e6998911cb5",
    "contentType": "object",
    "lastModified": "2015-09-09T18:23:28.000Z"
  }
}
```

Your *job id* is the hash that appears as the first key in the JSON object (in this case: `39aa77396352b2b19c8cab7450b06791a8652e6e`).


## Create a job on the executor
```console
curl -X POST 'http://104.197.75.234:8888/rest/executor/create/39aa77396352b2b19c8cab7450b06791a8652e6e'
```

```json
{
  "hash": "39aa77396352b2b19c8cab7450b06791a8652e6e",
  "resultHashes": [],
  "resultSuperSet": null,
  "userId": [],
  "status": "CREATED",
  "createTime": "2015-09-09T18:45:22.983Z",
  "startTime": null,
  "finishTime": null,
  "worker": null,
  "labels": []
}
```


## Poll
```console
curl -X GET 'http://104.197.75.234:8888/rest/executor/info/39aa77396352b2b19c8cab7450b06791a8652e6e'
```

Response has:

- *status*: the status of the job
  - `CREATED`: the job is in the system, but no executor has picked it up yet
  - `RUNNING`: an executor has picked up the job and is running it
  - `FAILED_TO_EXECUTE`: an executor picked up the job and attempted to run it, but a failure occured
  - `SUCCESS`: the job has been run by an executor, and the results are ready to retrieve

```json
{
  "hash": "39aa77396352b2b19c8cab7450b06791a8652e6e",
  "resultHashes": [],
  "resultSuperSet": null,
  "userId": [],
  "status": "RUNNING",
  "createTime": "2015-09-09T18:58:40.877Z",
  "startTime": null,
  "finishTime": null,
  "worker": "Adams-iMac_5436",
  "labels": [],
  "_id": "aat06FquApMHW4Rj"
}
```

```json
{
  "hash": "39aa77396352b2b19c8cab7450b06791a8652e6e",
  "resultHashes": {
    "all": "b58d80e532e1f6f6985cb6515863ad4c86ce5b18"
  },
  "resultSuperSet": null,
  "userId": [],
  "status": "SUCCESS",
  "createTime": "2015-09-09T18:45:22.983Z",
  "startTime": "2015-09-09T18:45:25.102Z",
  "finishTime": "2015-09-09T18:45:25.106Z",
  "worker": "Adams-iMac_5436",
  "labels": [],
  "_id": "WoJUuasalZ9ppDR2"
}
```


## Retrieve the results
Get a ZIP file of the entire result:
```console
curl -X GET 'http://104.197.75.234:8888/rest/blob/download/b58d80e532e1f6f6985cb6515863ad4c86ce5b18' > file.zip
```

Retrieve the contents of a single file:
```console
curl -X GET 'http://104.197.75.234:8888/rest/blob/download/b58d80e532e1f6f6985cb6515863ad4c86ce5b18/job_stdout.txt'
```