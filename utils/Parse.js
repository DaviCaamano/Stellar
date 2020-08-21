const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const PROMISE_GATE_DEFAULT_VALUE = 10;
/**
A class for the parsing/formatting of strings/JSON.
*/
class Parse {

  getEnvVars = (envVars) => {

    if(!this.envVarsSet){

      for(let envVar of envVars){

        this[envVar[0].name] = envVar[0].value;
      }
      this.envVarsSet = true
    }
  };

  encryptPassword = (password) => {

    let salt = bcrypt.genSaltSync(this.BCRYPT_SALT_ROUNDS);
    return bcrypt.hashSync(password, salt)
  };

  signJWT = data => {

    let signature = jwt.sign(data, this.JWT_SECRET, {expiresIn: '24h'});
    return jwt.verify(signature, this.JWT_SECRET, (err, decoded) => {

      return signature;
    });
  };

  verifyPassword = (password, encryptedPassword) => {

    return new Promise((resolve, reject) => {

      bcrypt.compare(password, encryptedPassword, (err, decrypt) => {

        if((!err && decrypt)) resolve();
        else reject();
      })
    })
  }

  jwtVerify = (token) => {

    return new Promise((resolve, reject) => {

      jwt.verify(token, this.JWT_SECRET, (err, decoded) => {

        if(err) reject(err);
        else resolve(decoded);
      })
    });
  }

  promiseGate = (
      callback,
      argumentCollection,
      promiseGate = PROMISE_GATE_DEFAULT_VALUE,
      originalResolve = null,
      valueCollection = []
  ) => {

    if(!valueCollection) valueCollection = [];
    return new Promise((resolve, reject) => {

      let prmCollection = [];
      for (let i = 0; i < promiseGate && argumentCollection.length > 0; i++) {

        prmCollection.push(callback(...argumentCollection.shift()));
      }

      Promise.all(prmCollection).then(values => {

        if (valueCollection.length > 0) {
          valueCollection.push.apply(valueCollection, values);
          values = valueCollection;
        } else valueCollection = values;
        //Always finally resolve with the last
        if (!originalResolve) originalResolve = resolve;

        if (argumentCollection.length === 0) return originalResolve(values)
        //if there are more promises to proccess.
        this.promiseGate(callback, argumentCollection, promiseGate, originalResolve, values)
      })
    })
  }
}



module.exports = new Parse();
