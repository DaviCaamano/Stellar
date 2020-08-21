const express = require('express');
const router = express.Router();
const record = require('../Controller/Records');
const recordsAuth = require('../middleware/RecordsAuth');

router.use(recordsAuth);
router.post('/view', record.view_maintenanceRecord);
router.post('/view/unit', record.view_unit);
router.post('/view/record_type_dropdown', record.view_maintenanceTypeDropdown);
router.post('/view/unit_dropdown', record.view_unitDropDown);
router.post('/list', record.list_maintenanceRecord);
router.post('/list/unit', record.list_units);
router.post('/add/unit', record.add_unit);
router.post('/add', record.add_record);
router.post('/update', record.update_record);
router.post('/update/unit', record.update_unit);
router.post('/delete', record.delete_record);
router.post('/delete/unit', record.delete_unit);

module.exports = router;
