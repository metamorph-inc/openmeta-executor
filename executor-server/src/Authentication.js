import Basic from "express-authentication-basic";
import Errors from "throw.js";

class Authentication {
  constructor(userStore) {
    this.userStore = userStore;

    this.clientApiAuth = Basic((challenge, callback) => {
      const result = this.userStore.verifyUser(challenge.username, challenge.password);

      if(result === true) {
        callback(null, true, { user: challenge.username });
      } else {
        callback(null, false, { error: "INVALID_PASSWORD" });
      }
    });
  }

  clientApiRejectUnauthenticated(req, res, next) {
    if(req.authenticated) {
      next();
    } else {
      next(new Errors.Forbidden("Authentication required for this resource"));
    }
  }
}

export default Authentication;
