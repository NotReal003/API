const express = require('express');
const router = express.Router();

router.get('/', async (res) => {
  return res.status(200).json({ message: 'This is default Auth Route.' });
});

module.exports = router;
