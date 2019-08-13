import yargs from 'yargs';
import prompt from 'prompt';

import App from './app';
import UserStore from './UserStore';

const argv = yargs
  .command("*", "Start the executor server", {
    'listen-address': {
      alias: 'a',
      default: '0.0.0.0',
      string: true,
      description: "Address to listen on"
    },
    'listen-port': {
      alias: 'p',
      default: 8080,
      number: true,
      description: "Port to listen on"
    },
    'ignore-job-labels': {
      bool: true,
      description: "Ignore job labels when dispatching jobs (assume all workers can handle all jobs)"
    }
  }, (argv) => {
    const address = argv.listenAddress;
    const port = argv.listenPort;

    const app = App(argv.ignoreJobLabels);

    app.listen(port, address, () => console.log(`Listening on port ${port}`)); // eslint-disable-line no-console
  })
  .command("add-user <username>", "Adds a user to the user list", () => {}, (argv) => {
    prompt.get({
      properties: {
        password: {
          hidden: true,
          prompt: `Enter password for user ${argv.username}`,
          required: true,
          message: "Password must be non-blank and cannot contain ':'.",
          description: "Password",
          replace: "*",
          conform: (value) => {
            return value.indexOf(":") === -1;
          }
        }
      }
    }, (err, result) => {
      if(!err) {
        const userStore = new UserStore();
        userStore.addUser(argv.username, result.password);

        console.log("Successfully added user", argv.username); //eslint-disable-line no-console
      }
    });
  })
  .argv;
