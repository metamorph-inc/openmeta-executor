import fs from "mz/fs";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

class UserStore {
  constructor() {
    this.setDefaultConfig();
    this.readAuthConfigSync();
  }

  verifyUser(username, password) {
    const user = this.users.get(username);

    if(!user || !user.passwordHash) {
      return false;
    } else {
      return bcrypt.compareSync(password, user.passwordHash);
    }
  }

  setDefaultConfig() {
    this.users = new Map();
  }

  // TODO: If we start reloading the config at runtime, we should have an
  //       async version of this method (we need the sync version for the
  //       constructor, though).
  readAuthConfigSync() {
    try {
      const passwords_data = fs.readFileSync('auth.json');
      const parsedConfig = JSON.parse(passwords_data);
      this.users = new Map(parsedConfig.users);
    } catch(err) {
      this.setDefaultConfg();
    }
  }

  writeAuthConfigSync() {
    const config = {
      users: [...this.users]
    };

    fs.writeFileSync('auth.json', JSON.stringify(config));
  }

  addUser(username, password) {
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    this.users.set(username, {
      passwordHash: hashedPassword
    });

    this.writeAuthConfigSync();
  }
}

export default UserStore;
