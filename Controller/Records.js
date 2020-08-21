const db = require('../utils/Database');
const parse = require('../utils/Parse');
const record = require('../utils/Record');
let CUSTOM_RECORD_TYPE_ID;
class Records {

    constructor() {

        let query = `
            SELECT id
            FROM stellar.maintenance_types
            WHERE name = "Custom";`;
        db.query(query, true).then(customTypeRec => {

            CUSTOM_RECORD_TYPE_ID = customTypeRec[0].id;
        });
    }
    view_unitDropDown = (req, res) => {

        record.getUnitDropDown()
        .then(data => {

            res.send({ success: true, data })
        })
        .catch(err => res.send(err));
    };

    view_maintenanceTypeDropdown = (req, res) => {

        record.getMaintenanceTypeDropdown()
        .then(data => res.send({ success: true, data }))
        .catch(err => res.send(err));
    };

    view_maintenanceRecord = (req, res) => {

        let userId = req.body.user_id || req.decoded.user_id;
        if(!userId) return res.status(400).send({ success: false, error: 'Invalid Access Token.'});

        Promise.all([record.getMaintenanceRecord(userId), record.getUserName(userId)])
        .then(data => res.send({ success: true, records: data[0], 'Conducted By': data[1] }))
        .catch(err => res.send(err));
    };

    view_unit = (req, res) => {

        let userId = req.decoded.user_id;
        let unitId = req.body.unit_id,
            unitName = req.body.name,
            prms = [];

        if(unitId)
            prms.push(record.getUnit(unitId));
        else if(unitName)
            prms.push(record.getUnitByName(unitName));
        else
            return res.status(400).send({ success: false, error: 'No Unit ID given.'});

        prms.push(record.getUserName(userId));
        Promise.all(prms)
        .then(data => res.send({ success: true, records: data[0], 'Conducted By': data[1] }))
        .catch(err => res.send(err));
    };

    list_units = (req, res) => {

        let userId = req.decoded.user_id;
        Promise.all([record.getUnit(), record.getUserName(userId)])
            .then(data => res.send({ success: true, records: data[0], 'Conducted By': data[1] }))
            .catch(err => res.send(err));
    };


    list_maintenanceRecord = (req, res) => {

        record.getMaintenanceRecord()
        .then(data => {

            res.send({ success: true, records: data })
        } )
        .catch(err => res.send(err));
    };

    view_maintenanceTypeDropdown = (req, res) => {

        record.getMaintenanceTypeDropdown()
            .then(data => res.send({ success: true, data }))
            .catch(err => res.send(err));
    };

    add_unit = (req, res) => {

        let body = req.body;
        if(!body.name) res.status(400).send({ success: false, error: 'No unit name given.'});
        record.getHighestUnitPosition().then(highestPosition => {

            record.addUnit(body.name, body.engine_hours, body.status, highestPosition + 1)
            .then(() => res.send({ success: true, description: 'Unit Successfully Added.' }))
            .catch(err => res.status(500).send(err))
        });
    };


    add_record = (req, res) => {

        let body = req.body,
            fields = {};
        if(!body.unit_id) return res.status(400).send({ success: false, error: 'No unit id given.'});
        else fields.unit_id = parseInt(body.unit_id);
        if(!body.completed_at) return res.status(400).send({ success: false, error: 'A date of completion is required.'});
        else fields.completed_at = body.completed_at;
        if(!body.due_at) return res.status(400).send({ success: false, error: 'No unit name given.'});
        else fields.due_at = body.due_at;
        if(!body.system_engine_hours) return res.status(400).send({ success: false, error: 'No unit name given.'});
        else fields.system_engine_hours = body.system_engine_hours;
        if(!body.actual_engine_hours) return res.status(400).send({ success: false, error: 'No unit name given.'});
        else fields.actual_engine_hours = body.actual_engine_hours;
        if(!body.engine_hours_next_due) return res.status(400).send({ success: false, error: 'No unit name given.'});
        else fields.engine_hours_next_due = body.engine_hours_next_due;
        if(!req.decoded.user_id) return res.status(400).send({ success: false, error: 'No unit name given.'});
        else {

            fields.created_by = req.decoded.user_id;
            fields.updated_by = req.decoded.user_id;
        }

        let getTypeIdPrm = new Promise((resolve, reject) => {

            if (body.type_id) resolve(body.type_id);
            else if (body.type) {

                let typeQuery = `
                SELECT id
                FROM maintenance_types
                WHERE name = "${body.type}"
                LIMIT 1;`;
                db.query(typeQuery, true)
                .then(typeRec => resolve(typeRec))
                .catch(reject);
            } else reject({success: false, error: 'No type id given.'})
        }).then(typeRec => {

            let typeId = typeRec[0].id;

            if(typeId === CUSTOM_RECORD_TYPE_ID && !body.custom_type)
                return res.status(400).send({
                    success: false,
                    error: 'Custom record types require a custom_type field.'
                });
            fields.custom_type = body.custom_type;
            fields.type_id = typeId;
            record.addRecord(fields).then(() => res.send({ success: true, description: 'Record Successfully Added.'}));
        }).catch(err => res.status(400).send(err)        )

    };

    update_record = (req, res) => {

        let body = req.body;
        if(!body.record_id) res.status(400).send({ success: false, error: 'No Record Id Given.'});
        if(body.system_engine_hours)
            res.status(400).send({ success: false, error: 'System Engine Hours cannot be edited.'});

        let recordId = body.record_id,
            fields = { updated_by: req.decoded.user_id };

        new Promise((resolve, reject) => {

            if(body.type_id) resolve(body.type_id);
            else if(body.type) {

                let query = `
                SELECT id
                FROM maintenance_types
                WHERE name = "${body.type}"`;
                db.query(query, true).then(typeRec => {

                    resolve(typeRec[0].id);
                })
            }
            else resolve(false);
        }).then(typeId => {

            if(typeId){

                if(typeId === CUSTOM_RECORD_TYPE_ID){

                    if(!body.custom_type)
                        return res.status(400).send({
                            success: false,
                            error: 'Custom Type Units must have a custom_type field.'
                        });

                    fields.custom_type = body.custom_type;
                }
                fields.type_id = typeId;
            }

            if(body.unit_id) fields.unit_id = body.unit_id;
            if(body.completed_at) fields.completed_at = body.completed_at;
            if(body.due_at) fields.due_at = body.due_at;
            if(body.actual_engine_hours) fields.actual_engine_hours = body.actual_engine_hours;
            if(body.engine_hours_next_due) fields.engine_hours_next_due = body.engine_hours_next_due;

            record.updateRecord(recordId, fields).then(() => {

                res.send({ success: true, description: 'Update Successful.'})
            }).catch(err => res.status(400).send({ success: false, error: err}))
        });
    };

    update_unit = (req, res) => {

        let body = req.body;
        if(!body.unit_id) res.status(400).send({ success: false, error: 'No Unit Id Given.'});

        let unitId = body.unit_id,
            fields = {};
            if(body.status) fields.status = body.status;
            if(body.engine_hours) fields.engine_hours = body.engine_hours;
            if(body.position) fields.position = body.position;

            record.updateUnit(unitId, fields).then(() => {

                res.send({ success: true, description: 'Update Successful.'})
            }).catch(err => res.status(400).send({ success: false, error: err}))
    };

    delete_record = (req, res) => {

        if(!req.body.record_id) res.status(400).send({ success: false, error: 'No Record Id Given.'});

        let query =`
        DELETE FROM maintenance_records 
        WHERE id = ${req.body.record_id};`;
        db.query(query).then(() => res.send({ success: true, description: 'Deletion Complete'}))
        .catch(err => res.status(400).send({ success: false, error: err}));
    };

    delete_unit = (req, res) => {

        if(!req.body.unit_id) res.status(400).send({ success: false, error: 'No Unit Id Given.'});


        let query =`
        DELETE FROM units 
        WHERE id = ${req.body.unit_id};`;
        db.query(query).then(() => res.send({ success: true, description: 'Deletion Complete'}))
            .catch(err => res.status(400).send({ success: false, error: err}));
    };


    readUserData = (user_id) => {

        return new Promise((resolve, reject) => {
            let query = `
            SELECT name
            FROM units
            WHERE status = 1
            ORDER BY Position;
            SELECT 
                completed_at as completed_on, 
                due_at, 
                system_engine_hours, 
                actual_engine_hours, 
                engine_hours_next_due
            FROM maintenance_records r;
            SELECT 
                t.name, 
                r.custom_type, 
                created_by
            FROM maintenance_types t
            LEFT JOIN maintenance_records r
            ON t.id = r.type_id
            WHERE status = 1
            ORDER BY position ASC;
            SELECT note
            FROM maintenance_record_notes
            WHERE created_by = ${user_id};
            SELECT name
            FROM users
            WHERE id = ${user_id};
            `;
            db.query(query).then(resp => {

                resp = resp.data;

                let unitRecs = resp[0];
                let unitList = ['Select a Unit'];
                for(let rec of unitRecs)
                    unitList.push(rec.name);

                let recordRecs = resp[1],
                    records = [];
                for(let rec of recordRecs)
                    records.push({
                        'Completed On': rec.completed_on,
                        'Next Due': rec.due_at,
                        'System Engine Hours': rec.system_engine_hours,
                        'Actual Engine Hours': rec.actual_engine_hours,
                        'Engine Hours Next Due': rec.engine_hours_next_due,
                    });

                let types = [];
                for(let rec of resp[2])
                    if(rec.name && rec.name.toLowerCase() === 'custom')
                        types.push({ "Maintenance Type": rec.name, "Custom Type": rec.custom_type });
                    else
                        types.push({ "Maintenance Type": rec.name });

                let notes = [];
                for(let rec of resp[3])
                    notes.push(rec.note)

                resolve({
                    "Conducted By": resp[4][0].name,
                    Unit: unitList,
                    Records: records,
                    "Maintenance Types": types,
                    Notes: notes
                });
            }).catch(reject)
        });
    };
}

module.exports = new Records();