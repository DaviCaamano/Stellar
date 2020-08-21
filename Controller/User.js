const db = require('../utils/Database');
const parse = require('../utils/Parse');
const report = require('../utils/Error');

class User {

    OAuth = (req, res) => {

        let body = req.method === 'POST'? req.body: req.query;
        let invalidAuthError = (status, err) => {

            report.report(err);
            res.status(status).send({
                success: false,
                description: err,
            });
        };

        let query = `
        SELECT *
        FROM users
        WHERE email = "${body.username}"
        AND api_token = "${body.client_secret}";`;
        db.query(query).then(userRec => {

            if(!userRec.data || userRec.data.length === 0) {

                return invalidAuthError(400,'Invalid Username/Password');
            }
            let user = userRec.data[0];
            if(!user.status) return invalidAuthError(401, 'User Account is not Active.');

            parse.verifyPassword(body.password, user.password).then(() => {

                let accessToken = parse.signJWT({
                    email: user.email,
                    name: user.name,
                    role_id: user.role_id,
                    user_id: user.id
                });

                res.send({ success: true, access_token: accessToken });
            }).catch(() => invalidAuthError(500, 'Internal Server Error. [CODE 001].'));
        });
    }
}

module.exports = new User();