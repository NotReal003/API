const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/requests', require('./requests'));
router.use('/auth/user', require('./auth/ip'));
router.use('/admin', require('./admins'));
router.use('/server', require('./adminManage'));
router.use('/admin/staff', require('./admins/staff'))

module.exports = router;
