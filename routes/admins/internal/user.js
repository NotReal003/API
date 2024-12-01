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

router.get('/users/all', async (req, res) => {
  const token = req.headers['authorization'] || req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const myUser = await User.findOne({ id: decodedToken.id });
    if (!myUser) {
      return res.status(401).json({ code: 0, message: 'Unauthorized: User not found' });
    }

    const isAdmin = myUser.id === process.env.ADMIN_ID || myUser.admin === true;
    if (!isAdmin) {
      return res.status(403).json({ code: 0, message: 'Forbidden: Admin access required' });
    }

    const users = await User.find({}, '-accessToken -refreshToken');
    if (!users.length) {
      return res.status(404).json({ message: 'No users found' });
    }

    const maskedUsers = users.map(user => ({
      ...user.toObject(),
      email: maskEmail(user.email),
    }));

    return res.status(200).json({ users: maskedUsers });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Session expired. Please log in again' });
    }

    return res.status(500).json({ message: 'Internal server error. Please try again later' });
  }
});

// Utility function to mask email
function maskEmail(email) {
  const [localPart, domain] = email.split('@');
  const visiblePart = localPart.slice(-4); // Keep last 4 characters of local part visible
  return `***${visiblePart}@${domain}`;
}

module.exports = router;