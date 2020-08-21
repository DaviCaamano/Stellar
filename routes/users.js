const express = require('express');
const router = express.Router();
const User = require('../Controller/User');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/oauth', User.OAuth);
router.post('/oauth', User.OAuth);

module.exports = router;
