import app from "./app";

import yargs from "yargs";

const argv = yargs
  .command("* <server> <key>", "Start the executor worker connecting to the specified server with the specified key", {
    'labels': {
      alias: 'l',
      default: '',
      string: true,
      description: 'Comma-separated list of labels that this worker is capable of handling'
    }
  }, (argv) => {
    app(argv.server, argv.key, argv.labels);
  })
  .argv;
