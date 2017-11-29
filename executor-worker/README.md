# OpenMETA Remote Execution Worker

Remote execution worker for [OpenMETA](https://www.metamorphsoftware.com/openmeta/).

## Getting Started

### Prerequisites

  * Node.js - https://nodejs.org/en/
  * A running OpenMETA Remote Execution Server (see the server's README for
    more information)

### Before running for the first time

 1. Gather needed connection information from the execution server--  note in
    the value of `workerKey` in `auth.json` in the server's working directory,
    and note the IP address of the execution server.

 2. Install Node.js dependencies:

        npm install

### Running

    npm start -- "http://<server-address>:8080/" "<workerKey>"

where `<server-address>` is the IP address or hostname of the execution server,
and `<workerKey>` is the value of `workerKey` from `auth.json` in the server's
working directory.

### Running (for development)

To run using `nodemon` to automatically reload when the source code changes,
run with:

    npm run dev "http://<server-address>:8080/" "<workerKey>"
