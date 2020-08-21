const db = require('../utils/Database');
const parse = require('../utils/Parse');

let auth = (req, res, next) => {


    let token = req.headers['authorization'];

    if (!token) {

        return res.status(403).json({
            success: false,
            description: 'Auth JWT NOT supplied'
        });
    }
    if (token.startsWith('Bearer ')) {

        token = token.slice(7, token.length);
    }

    parse.jwtVerify(token).then(decoded => {

        console.log('decoded')
        console.log(decoded)
        req.decoded = decoded;
        if(decoded.exp < new Date().getTime()/1000){

            return res.status(401).send({ success: false, error: 'Auth Token has expired.' })
        }

        let action = req.originalUrl.split('/')[3];

        //TO DO check JWT Token against IP address in authentication table.
        return new Promise((resolve, reject) => {

            //If no records are found the token is a forgery and should be rejected.
            resolve();
        }).then(() => {

            let query = `
            SELECT p.name
            FROM users u
            RIGHT JOIN role_permissions rp
            ON rp.role_id = u.role_id
            LEFT JOIN permissions p
            ON p.id = rp.permission_id
            WHERE email = "${decoded.email}";`;
            db.query(query).then(permissionRecs => {

                console.log('permissionRecs');
                console.log(permissionRecs);

                let permissions = [];
                for(let permission of permissionRecs.data)
                    permissions.push(permission.name);

                switch(action) {
                    case 'view':
                        action = 'maintenance_records_view';
                        break;

                    case 'list':
                        action = 'maintenance_records_list';
                        break;

                    case 'add':
                        action = 'maintenance_records_add';
                        break;

                    case 'update':
                        action = 'maintenance_records_update';
                        break;

                    case 'delete':
                        action = 'maintenance_records_delete';
                        break;

                    case 'search':
                        action = 'maintenance_records_search';
                        break;
                }

                if(permissions.includes(action))
                    next();
                else res.status(401).send({ success: false, error: 'Unauthorized. '});
            });
        }).catch(() => {

            return res.status(401).send({ success: false, error: 'Invalid Auth Token.' })
        });



        //     resp = resp.data;
        //     if(!resp){
        //
        //         log.error('JWT verification : FAILURE. Auth TOKEN not Found. ');
        //         req.jwt_error = {
        //             success: false,
        //             error: err,
        //             description: 'Auth token not found'
        //         };
        //         res.status(403).json(req.jwt_error);
        //     }
        //     else{
        //
        //         req.decoded = decoded;
        //         req.body.decoded = decoded;
        //         next();
        //     }
        // }).catch(err => {
        //
        //     err.location = 'Error in jwt_middleware.check().';
        //     log.error(err);
        //     res.status(err.status).json(err);
        // });

    }).catch(err => {

        console.log('err');
        console.log(err);
        res.status(401).send({ success: false, error: 'Auth Token is not valid.'})
    });

};

module.exports = auth;