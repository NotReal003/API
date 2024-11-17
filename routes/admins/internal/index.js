const express = require('express');
const router = express.Router();
const blackList = require('../../../models/Blacklist');

router.get('/code/blacklist', async (req, res) => {
  const user = await req.user;

  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  if (user.admin === true) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ message: 'You do not have permission to view this area.' });
  }

  try {
    const blacklist = await blackList.find();
    res.status(200).json(blacklist);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching blacklist' });
  }
});


module.exports = router;