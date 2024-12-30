const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.status(200).json({ message: 'This is the default Auth Route.' });
  } catch (error) {
    console.error('Error in the default auth route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
