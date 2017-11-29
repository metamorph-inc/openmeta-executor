# OpenMETA Remote Execution Server

Remote execution server for [OpenMETA](https://www.metamorphsoftware.com/openmeta/).

## Getting Started

### Prerequisites

  * Node.js - https://nodejs.org/en/

### Before running for the first time

 1. Install Node.js dependencies:

        npm install

 2. Create the first user and initialize the worker shared secret:

        npm start -- add-user <username>

    Enter a password when prompted.

### Running

    npm start

### Running (for development)

To run using `nodemon` to automatically reload when the source code changes,
run with:

    npm run dev
