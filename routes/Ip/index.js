const express = require('express');
const router = express.Router();
const BannedIP = require('../../models/BannedIp');

// Get User IP

router.get('/myIp', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (ip) {
    return res.status(200).json({ ip: ip });
  }
  else {
    return res.status(400).json({ message: 'Failed to get IP address.' });
  }
});

router.get('/checkMyIp', async (req, res) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const bannedIp = await BannedIP.findOne({ ipAddress });
    if (bannedIp) {
      return res.status(403).json({ message: 'Your IP has been banned by our services…' });
    } else {
      return res.status(200).json({ message: 'Your IP is not banned.' });
    }
  } catch (error) {
    console.error('Error checking IP ban:', error);
    res.status(500).json({ message: 'Internal server error.' }); 
  };
});

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
