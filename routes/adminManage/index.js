const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Ensure jwt is required
const Server = require('../../models/Server');
const User = require('../../models/User');

router.put('/manage-api', async (req, res) => {
  const { closeType, user } = req.body;
  const cookies = req.cookies;
  const token = cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'A: 401 Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ message: 'A: Forbidden' });
    }

    try {
      const myUser = await User.findOne({ id: decodedToken.id });

      if (!myUser) {
        return res.status(401).json({ code: 0, message: 'Unauthorized' });
      }

      // user is admin
      if (myUser.id === process.env.ADMIN_ID) {
        myUser.isAdmin = true;
      }

      if (!myUser.isAdmin) {
        return res.status(403).json({ code: 0, message: 'You do not have permission to manage this server.' });
      }
      const requestId = '66ce114ad047465fb13c4464';
      const myServer = await Server.findById(requestId);

      if (!myServer) {
        return res.status(404).json({ message: 'Server not found' });
      }

      if (closeType === undefined || closeType === null) {
        return res.status(400).json({ code: 0, message: 'A: Request cannot be empty.' });
      }
      if (!closeType) {
        return res.status(400).json({ code: 0, message: 'B: Request cannot be empty.' });
      }

      myServer.serverClosed = closeType;

      await myServer.save();

      res.status(200).json({ code: 1, message: 'Server updated successfully!', token });
    } catch (error) {
      console.error('Error updating server:', error);
      res.status(500).json({ code: 0, message: 'Failed to update server status. Please try again later.' });
    }
  });
});

router.get('/manage-api', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'A: Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ message: 'A: Forbidden' });
    }

    try {
      const myUser = await User.findOne({ id: decodedToken.id });

      if (!myUser) {
        return res.status(401).json({ code: 0, message: 'Unauthorized' });
      }

      // Assuming ADMIN_ID is a specific user ID
      if (myUser.id === process.env.ADMIN_ID) {
        myUser.isAdmin = true;
      }

      if (!myUser.isAdmin) {
        return res.status(403).json({ code: 0, message: 'You do not have permission to manage this server.' });
      }
      const requestId = '66ce114ad047465fb13c4464';
      const myServer = await Server.findById(requestId);

      if (!myServer) {
        return res.status(404).json({ message: 'Server not found' });
      }
      res.status(200).json({ message: myServer });
    } catch (error) {
      console.error('Error updating server:', error);
      res.status(500).json({ code: 0, message: 'Failed to update server status. Please try again later.' });
    }
  });
});

module.exports = router;
