import yargs from 'yargs';
import prompt from 'prompt';

import app from './app';
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
    }
  }, (argv) => {
    const address = argv.listenAddress;
    const port = argv.listenPort;

    app.listen(port, address, () => console.log(`Listening on port ${port}`)); // eslint-disable-line no-console
  })
  .command("add-user <username>", "Adds a user to the user list", () => {}, (argv) => {
    prompt.get({
      properties: {
        password: {
          hidden: true,
          prompt: `Enter password for user ${argv.username}`,
          required: true,
          message: "Must enter a non-blank password.",
          description: "Password",
          replace: "*"
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
