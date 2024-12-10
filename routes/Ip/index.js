const express = require('express');
const router = express.Router();
const BannedIP = require('../../models/BannedIp');

// Find all banned IPs
router.get('/banned', async (req, res) => {
  
  const user = await req.user;
  let isAdmin = false;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID) {
    isAdmin = true;
  }

  if (user.admin = true) {
    isAdmin = true;
  }

  if (!isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this area.' });
  }
  
  try {
    const bannedIPs = await BannedIP.find();
    res.json(bannedIPs);
  } catch (error) {
    console.error('Error fetching banned IPs:', error);
    res.status(500).json({ message: 'Failed to fetch banned IPs. Please try again later.' });
  }
});
// Add an IP ban
router.post('/ban', async (req, res) => {
  const { ipAddress, reason, expiresAt } = req.body;

  const user = await req.user;
  let isAdmin = false;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID) {
    isAdmin = true;
  }

  if (user.admin = true) {
    isAdmin = true;
  }

  if (!isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this area.' });
  }

  try {
    const findIp = await BannedIP.findOne({ ipAddress });
    if (findIp) {
      return res.status(400).json({ code: 0, message: 'This IP is already banned.' });
      
    }
    const bannedIp = new BannedIP({ ipAddress, reason, expiresAt });
    await bannedIp.save();
    res.status(201).json({ message: 'IP banned successfully.' });
  } catch (error) {
    res.status(400).json({ message: 'Error banning IP.', error: error.message });
  }
});

router.delete('/unban', async (req, res) => {
  const { ipAddress } = req.body;

  if (!ipAddress) {
    return res.status(400).json({ message: 'Please provide an IP address to unban.' });
  }

  const user = await req.user;
  let isAdmin = false;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID) {
    isAdmin = true;
  }

  if (user.admin = true) {
    isAdmin = true;
  }

  if (!isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this area.' });
  }

  try {
    const findIp = await BannedIP.findOne({ ipAddress });
    if (!findIp) {
      return res.status(404).json({ message: 'This IP is not banned.' });
    }
    await BannedIP.deleteOne({ ipAddress });
    res.status(200).json({ message: 'IP unbanned successfully.' });
  } catch (error) {
    res.status(400).json({ message: 'Error unbanning IP.', error: error.message });
  }
});

module.exports = router;
