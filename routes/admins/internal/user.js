const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');

router.get('/:user', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.admin === true) {
    user.isAdmin = true;
  }
  if (user.id === process.env.ADMIN_ID) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this area.' });
  }

  try {
    const request = await User.find();

    if (!request) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User found!', user: request });
  } catch (error) {
    console.error('Error finding user:');
    res.status(500).json({ message: 'There was an error while finding the user. Please try again later.' });
  }
});

router.get('/users', async (req, res) => {
  const token = req.headers['authorization'] || req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const myUser = await User.findOne({ id: decodedToken.id });
    if (!myUser) {
      return res.status(401).json({ code: 0, message: 'Unauthorized' });
    }

    const isAdmin = myUser.id === process.env.ADMIN_ID || myUser.admin === true;
    if (!isAdmin) {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view this area.' });
    }

    // Fetch all users
    const myServer = await User.find();
    if (!myServer.length) {
      return res.status(404).json({ message: 'Users not found' });
    }
    
    res.status(200).json({ users: myServer });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'invaild Accses' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Your session has been expired' });
    } else {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users. Please try again later.' });
    }

    // General server error
    return res.status(500).json({ message: 'Sorry, there was an error...' });
  }
});

module.exports = router;