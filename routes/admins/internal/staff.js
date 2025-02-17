const express = require('express');
const router = express.Router();
const User = require('../../../models/User');

router.patch('/manage/:promoUser', async (req, res) => {
  const user = await req.user;
  const { promoUser } = req.params;
  const userRole = req.body.role;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.admin === true || user.id === process.env.ADMIN_ID) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this area.' });
  }

  try {
    const request = await User.findOne({ id: promoUser });

    if (!request) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userRole === "mod") {
    request.staff = true;
    }
    if (userRole === "admin") {
      request.admin = true;
    } else if (userRole === "user") {
      request.admin = false;
      request.staff = false;
    }
    await request.save();
    res.status(200).json({ message: 'Promoted user to staff successfully!' });
  } catch (error) {
    console.error('Error updating user:');
    res.status(500).json({ message: 'There was an error while updating the user. Please try again later.' });
  }
});

router.put('/demote/:demoUser', async (req, res) => {
  const user = await req.user;
  const { demoUser } = req.params;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this area.' });
  }

  try {
    const request = await User.findOne({ id: demoUser });

    if (!request) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (request.staff === false) {
      res.status(400).json({ message: 'This user is not staff member.' });
    }

    request.staff = false;
    await request.save();
    res.status(200).json({ message: 'Demoted staff to normal user successfully!' });
  } catch (error) {
    console.error('Error updating user:');
    res.status(500).json({ message: 'There was an error while updating the user. Please try again later.' });
  }
});

module.exports = router;
