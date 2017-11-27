import yargs from 'yargs';
import prompt from 'prompt';

import app from './app';
import UserStore from './UserStore';

const argv = yargs
  .command("*", "Start the executor server", () => {}, (argv) => {
    const { PORT = 8080 } = process.env;
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`)); // eslint-disable-line no-console
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

        console.log("Successfully added user", argv.username);
      }
    });
  })
  .argv;
