# OpenMETA Remote Execution Server

Remote execution server for [OpenMETA](https://www.metamorphsoftware.com/openmeta/).

## Getting Started

### Prerequisites

  * Node.js - https://nodejs.org/en/
  * Yarn - https://yarnpkg.com/en/docs/install

### Before running for the first time

 1. Install Node.js dependencies:

        yarn

 2. Create the first user and initialize the worker shared secret:

        yarn start add-user <username>

    Enter a password when prompted.

### Running

    yarn start

### Running (for development)

To run using `nodemon` to automatically reload when the source code changes,
run with:

    yarn run dev
