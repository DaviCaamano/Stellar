const mysql = require('mysql2');
const parse = require('./Parse');

let db;
try{
    db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,
        connectionLimit: 100
    });
}
catch(e){ console.log(e); }

class Database {

    constructor(){

        if(!this.envVarsSet){

            let query = `
            SELECT * 
            FROM env
            WHERE name = "BCRYPT_SALT_ROUNDS";
            SELECT * 
            FROM env
            WHERE name = "JWT_SECRET";`;
            this.query(query).then(envVars => {

                let parseVars = [envVars.data[0], envVars.data[1]];
                parse.getEnvVars(parseVars);
                this.envVarsSet = true;
            });
        }
    }
    query(query, raw = false){

        console.log('db.query');
        console.log(query);
        return new Promise(async (resolve, reject) => {

            db.query(query, (err, resp) => {

                if (err)
                    reject({
                        success: false,
                        description: 'Internal Server Error',
                        status: 500,
                        error: err
                    });
                else
                if (raw)
                    resolve(resp);
                else
                    resolve({ success: true, data: resp });
            });
        })
    }

    createInsertValues(...args){

        if(args.length === 0) return '';
        else if(args.length === 1) return args[0];
        else{
            let argumentString = '';

            for(let i in args){

                if(i > 0) argumentString = argumentString + ', ';
                if(args[i] === null || typeof args[i] === 'undefined') argumentString = argumentString + 'NULL';
                else if(typeof args[i] === 'boolean') {
                    if (args[i] === false) argumentString = argumentString + '0';
                    else argumentString = argumentString + '1';
                }
                else if(typeof args[i] === 'object') argumentString += this.parseObjectForQuery(args[i]);
                else if(typeof args[i] === 'number' || typeof args[i] === 'number')
                    argumentString = argumentString + '' + args[i];
                else argumentString = argumentString + '"'+ args[i] + '"'
            }
            return argumentString;
        }
    }

    insertQueryParams(fields){

        try {

            if(typeof fields !== 'object' && Array.isArray(fields))
                throw new Error('Insert Query Params function only accepts JSON.');
            let values = [];
            for(let field in fields)
                values.push(fields[field]);

            return {
                columns: this.createInsertColumns(...Object.keys(fields)),
                values: this.createInsertValues(...values)
            }
        } catch(e){

            e.location = "Error in db_functions.insertQueryParams().";
            log.error(e);
        }


    }
    createInsertColumns(...args){

        if(args.length === 0) return '';
        else if(args.length === 1) return args[0];
        else{
            let argumentString = '';
            for(let i in args){

                if(i > 0) argumentString = argumentString + ', ';
                if(args[i] === null || typeof args[i] === 'undefined') argumentString = argumentString + '';
                else argumentString = argumentString + args[i];
            }
            return argumentString;
        }
    }

    parseObjectForQuery(obj, level = 0){

        let stringified = level === 0? '"': '';
        stringified += Array.isArray(obj)? '[': '{';

        let iter = 0;
        for(let prop in obj) {

            if (iter++ > 0) stringified += ', ';
            if (typeof obj[prop] === 'object' && obj[prop] !== null)

                if (!Array.isArray(obj))
                    stringified += '\\"' + prop + '\\":' + this.parseObjectForQuery(obj[prop], level + 1);
                else
                    stringified += this.parseObjectForQuery(obj[prop], level + 1);

            //Property value is a string and needs quotations
            else if (typeof obj[prop] === 'string') {

                if (!Array.isArray(obj))
                    stringified += '\\"' + prop.replace(/"/g, '\\"') + '\\":\\"' + obj[prop].replace(/"/g, '\\"') + '\\"';
                else
                    stringified += '\\"' + obj[prop].replace(/"/g, '\\"') + '\\"';
            }
            else if (typeof obj[prop] === 'undefined')

                stringified += '\\"' + prop + '\\":\\"' + null + '\\"';

            //Property value is not a string or object, and does not need quotations.
            else
            if (!Array.isArray(obj))
                stringified +=  '\\"' + prop + '\\":' + obj[prop];
            else
                stringified +=  obj[prop] ;
        }

        stringified += Array.isArray(obj)? ']': '}';
        stringified += level === 0? '"': '';
        return stringified ;
    }

    parseObjectForUpdate(obj){

        if(Object.keys(obj).length === 0) return '';
        let argumentString = '',
            iter = 0;
        for(let i in obj){

            if(iter++ > 0) argumentString += ', ';
            if(obj[i] === null || typeof obj[i] === 'undefined') argumentString += i + ' = NULL';
            else if(obj[i] === false) argumentString += i + ' = 0';
            else if(obj[i] === true) argumentString += i + ' = 1';
            else if(typeof obj[i] === 'object')  argumentString += i + ' = ' + this.parseObjectForQuery(obj[i]);
            else if(typeof obj[i] === 'number' || typeof obj[i] === 'boolean') argumentString += i + ' = ' + obj[i];
            else argumentString += i + ' = "'+ obj[i] + '"'
        }
        return argumentString;
    }
}

module.exports = new Database();
