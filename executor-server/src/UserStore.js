import fs from "mz/fs";
import bcrypt from "bcrypt";

class UserStore {
  constructor() {
    this.users = new Map();
    this.readAuthConfig();
  }

  verifyUser(username, password) {
    const user = this.users.get(username);

    if(!user || !user.passwordHash) {
      return false;
    } else {
      return bcrypt.compareSync(password, user.passwordHash);
    }
  }

  readAuthConfig() {
    const rs = fs.createReadStream('auth.json');
    let passwords_data = '';
    rs.on('data', (chunk) => {
      passwords_data = passwords_data + chunk;
    });
    rs.on('end', () => { // Note: arrow functions don't rebind 'this'
      try {
        const parsedConfig = JSON.parse(passwords_data);
        this.users = new Map(parsedConfig.users);
      } catch(err) {
        // Fall back to default config if config file isn't parsable
        this.users = new Map();
      }
    });
  }
}

export default UserStore;
