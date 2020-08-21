const db = require('../utils/Database');
const parse = require('../utils/Parse');

class Records {

    getUnitDropDown = () => {

        return new Promise((resolve, reject) => {

            let  query = `
            SELECT name
            FROM units
            WHERE status = 1
            ORDER BY Position ASC;`;
            db.query(query, true).then(unitRecs => {

                let unitList = ['Select a Unit'];
                for(let rec of unitRecs)
                    unitList.push(rec.name);
                resolve(unitList);
            }).catch(err => reject(this.reportDBQueryError(err)));
        })

    };

    getMaintenanceTypeDropdown = () => {

        return new Promise((resolve, reject) => {

            let query = `
            SELECT 
                t.name as "Maintenance Type",
                r.custom_type as "Custom Type"
            FROM maintenance_records r
            LEFT JOIN maintenance_types t
            ON r.type_id = t.id;`;
            db.query(query, true).then(typeRecs => {

                let typeList = [{ 'Maintenance Type': 'Select a Unit' }];
                for(let rec of typeRecs)
                    if(rec['Maintenance Type'] && rec['Maintenance Type'].toLowerCase() === 'custom')
                        typeList.push({
                            'Maintenance Type': rec['Maintenance Type'],
                            'Custom Type': rec['Custom Type']
                        });
                    else
                        typeList.push({ 'Maintenance Type': rec['Maintenance Type'] });

                resolve(typeList);
            }).catch(err => reject(this.reportDBQueryError(err)));
        })
    };

    getMaintenanceRecord = (userId) => {

        return new Promise((resolve, reject) => {

            let query = `
            SELECT 
                completed_at as "Completed On",
                due_at as "Next Due",
                system_engine_hours as "System Engine Hours",
                actual_engine_hours as "Actual Engine Hours"
            FROM maintenance_records `;
            if(userId)
                query += `
                WHERE created_by = ${userId};`;

            db.query(query, true).then(recordRec => resolve(recordRec))
                .catch(err => reject(this.reportDBQueryError(err)));
        })
    };

    getUnit = (unitId) => {

        return new Promise((resolve, reject) => {

            let query = `
            SELECT 
                status as "Active",
                name as "Name",
                engine_hours as "Engine Hours",
                position as "Position"
            FROM units `;
            if(unitId)
                query += `
                WHERE id = ${unitId};`;

            db.query(query, true).then(recordRec => resolve(recordRec))
                .catch(err => reject(this.reportDBQueryError(err)));
        })
    };

    getUnitByName = (name) => {

        return new Promise((resolve, reject) => {

            let query = `
            SELECT 
                id as "ID",
                status as "Active",
                name as "Name",
                engine_hours as "Engine Hours",
                position as "Position"
            FROM units `;
            if(name)
                query += `
                WHERE name = ${name};`;

            db.query(query, true).then(recordRec => resolve(recordRec))
                .catch(err => reject(this.reportDBQueryError(err)));
        })
    };

    getUserName = (userId) => {

        return new Promise((resolve, reject) => {

            let query = `
            SELECT name 
            FROM users
            WHERE id = ${userId}`
            db.query(query, true).then(userRec => {

                resolve(userRec[0].name);
            }).catch(err => reject(this.reportDBQueryError(err)));

        })
    };

    getHighestUnitPosition = () => {

        return new Promise((resolve, reject) => {

            let query = `
            SELECT MAX(position) as max
            FROM units;`;
            db.query(query, true)
            .then(highestPosition => resolve(highestPosition[0].max))
            .catch(err => reject(this.reportDBQueryError(err)));
        })

    };

    addUnit = (name, engine_hours = 0, status, position) => {

        return new Promise((resolve, reject) => {

            if(!name) return reject({ success: false, description: 'Name field missing from unit creation.'});

            let fields = { name };
            if(engine_hours) fields.engine_hours = engine_hours;
            if(status) fields.status = status;
            if(position) fields.position = position;

            let insertParams = db.insertQueryParams(fields);
            let query = `
            INSERT INTO units (${insertParams.columns})
            VALUES (${insertParams.values});`;
            db.query(query, true)
            .then(data => resolve(data))
            .catch(err => reject({ success: false, error: err }));
        });
    };

    addRecord = (fields) => {

        return new Promise((resolve, reject) => {

            let insertParams = db.insertQueryParams(fields);
            let query = `
            INSERT INTO maintenance_records (${insertParams.columns})
            VALUES (${insertParams.values});`;
            db.query(query)
            .then(data => resolve(data))
            .catch(err => reject({ success: false, error: err }));
        })

    };

    updateUnit = (unitId, fields) => {

        return new Promise((resolve, reject) => {

            let query = `
            UPDATE units SET ${db.parseObjectForUpdate(fields)}
            WHERE id = ${unitId};`;
            db.query(query).then(resolve).catch(reject);
        });

    };

    updateRecord = (recordId, fields) => {

        return new Promise((resolve, reject) => {

            let query = `
            UPDATE maintenance_records SET ${db.parseObjectForUpdate(fields)}
            WHERE id = ${recordId};`;
            db.query(query).then(resolve).catch(reject);
        });
    };

    reportDBQueryError = (err, description) => {

        if(description)
            err.description = description;

        console.log(err);
        return { success: false, error: err };
    };
}

module.exports = new Records();