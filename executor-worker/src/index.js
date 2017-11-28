import app from "./app";

import yargs from "yargs";

const argv = yargs
  .command("* <server> <key>", "Start the executor worker connecting to the specified server with the specified key", () => {}, (argv) => {
    app(argv.server, argv.key);
  })
  .argv;
