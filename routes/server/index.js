const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Count = require('../../models/Count');
const rateLimit = require('express-rate-limit');
const path = require('path');

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get('/temp/email', (req, res) => {
  res.sendFile(path.join(__dirname, 'routes', 'admins', 'send.html'));
});

router.get('/images/logo', (req, res) => {
  const imagePath = path.join(__dirname, 'routes', 'admins', 'IMG_3275.jpeg');
  res.sendFile(imagePath);
});

router.get("/source", (req, res) => {
  res.redirect('https://github.com/notreal003/API');
});

router.get("/producthunt", (req, res) => {
  res.redirect('https://www.producthunt.com/products/request-managemen-portal');
});

router.get("/video", (req, res) => {
  res.redirect('https://youtu.be/Rm79yXU3p80?si=KeoRH2Ayv1-H__y8');
});

const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Only 5 requests per 10 minutes
  message: 'Too many requests. Try again later...',
});

function maskEmail(email) {
  const [localPart, domain] = email.split('@');
  const visiblePart = localPart.slice(-4); // Keep last 4 characters of local part visible
  return `***${visiblePart}@${domain}`;
}

router.get('/visits', async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.admin) {
      return res.status(user ? 403 : 401).json({ message: 'Unauthorized' });
    }

    const countRecords = await Count.find();

    const pageStats = countRecords.map((record) => ({
      pageType: record.pageType,
      totalVisits: record.totalVisits,
      dailyVisits: Array.from(record.dailyVisits.entries()), // Convert Map to array
      weeklyVisits: Array.from(record.weeklyVisits.entries()), // Weekly details
      monthlyVisits: Array.from(record.monthlyVisits.entries()), // Monthly details
    }));

    res.status(200).json({
      success: true,
      pageStats,
    });
  } catch (error) {
    console.error('Error fetching visit data:', error);
    res.status(500).json({ success: false, message: 'Error fetching visit data.' });
  }
});

router.get('/manage/user/:user', async (req, res) => {
  const users = await req.user;

  if (!users) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (users.admin === true) {
    users.isAdmin = true;
  }
  if (users.id === process.env.ADMIN_ID) {
    users.isAdmin = true;
  }

  if (!users.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this area.' });
  }

  try {
    const user = await User.findOne({ id: req.params.user });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = maskEmail(user.email),

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error finding user:');
    res.status(500).json({ message: 'There was an error while finding the user. Please try again later.' });
  }
});

router.get('/manage/users/all', adminLimiter, async (req, res) => {
  try {
    const user = await req.user;
    if (!user) {
    return res.status(401).json({ code: 0, message: 'A: Unauthorized' });  
    }
    const myUser = await User.findOne({ id: user.id });
    if (!myUser) {
      return res.status(401).json({ code: 0, message: 'Unauthorized: User not found' });
    }

    const isAdmin = myUser.id === process.env.ADMIN_ID || myUser.admin === true;
    if (!isAdmin) {
      return res.status(403).json({ code: 0, message: 'Admin access required' });
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

module.exports = router;
