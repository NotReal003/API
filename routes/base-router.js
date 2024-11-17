const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/requests', require('./requests'));
router.use('/auth', require('./auth/internal'));
router.use('/auth', require('./auth/internal/e-signin'));
router.use('/auth', require('./auth/internal/e-signup'));
router.use('/auth', require('./auth/internal/github'));
router.use('/auth', require('./auth/internal/discord'));
router.use('/auth/user', require('./auth/internal/ip'));
router.use('/admin', require('./admins'));
router.use('/server', require('./adminManage'));
router.use('/admin/staff', require('./admins/staff'))

module.exports = router;
