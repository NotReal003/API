const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../../models/User');
const Buser = require('../../models/Buser');

function maskEmail(email) {
  if (typeof email !== "string" || !email.includes("@")) {
    throw new Error("Invalid email format");
  }

  const trimmedEmail = email.trim().toLowerCase();
  const [localPart, domain] = trimmedEmail.split("@");

  if (!localPart || !domain) {
    throw new Error("Invalid email structure");
  }

  if (localPart.length <= 2) {
    return `${localPart.at(0)}***@${domain}`;
  }

  const firstChar = localPart.at(0);
  const lastChar = localPart.at(-1);
  const maskedPart = "*".repeat(Math.max(1, localPart.length - 2));

  return `${firstChar}${maskedPart}${lastChar}@${domain}`;
}

//function maskEmail(email) {
//  const [localPart, domain] = email.split('@');
//  const visiblePart = localPart.slice(-8);
//  return `***${visiblePart}@${domain}`;
//}
// GET: api.notreal003.xyz/auth/@me
router.get('/@me', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'U1: Unauthorized' });
    }
    const user = await req.user;

    if (!user) {
      return res.status(401).json({ code: 0, message: 'U2: Unauthorized' });
    }

    if (user.authType === 'github') {
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatarHash,
        authType: user.authType,
        joinedAt: user.joinedAt,
      });
    }
    if (user.authType === 'email') {
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatarHash,
        authType: user.authType,
        joinedAt: user.joinedAt,
        staff: user.staff,
        admin: user.admin,
      });
    }
    if (user.authType === 'google') {
      const userEmail = maskEmail(user.email);
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: userEmail,
        avatarHash: user.avatarHash,
        authType: user.authType,
        joinedAt: user.joinedAt,
        staff: user.staff,
        admin: user.admin,
      });
    }
    if (!user.accessToken) {
      return res.status(401).json({ message: 'U 401: Unauthorized' });
    }
    const discordApiUrl = 'https://discord.com/api/v10/users/@me';

    let discordData;
    try {
      const response = await axios.get(discordApiUrl, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`
        }
      });
      discordData = response.data;
    } catch (error) {
      return res.status(403).json({ code: 1, message: `Discord API Error: ${error.message}`});
    }

    const discordUserAv = `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.webp?size=128`;
    const discordUserData = {
      id: discordData.id,
      username: discordData.username,
      avatar: discordData.avatar
    };

    const userEmail = maskEmail(user.email);

    res.json({
      id: user.id,
      username: user.username,
      avatarHash: discordUserAv,
      email: userEmail,
      displayName: user.displayName,
      joinedAt: user.joinedAt,
      authType: user.authType,
      staff: user.staff,
      admin: user.admin,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    next(error);
    res.status(500).json({ code: 1, message: 'Internal Server Error' });
  }
});

router.patch('/display', async (req, res, next) => {
  const { displayName } = req.body;

  if (!displayName || displayName.trim() === '') {
    return res.status(400).json({ code: 0, message: 'Display name cannot be empty.' });
  }

  if (displayName.length < 3 || displayName.length > 16) {
    return res.status(400).json({ message: 'Display name must be between 3 and 16 characters.' });
  }

  try {
    const user = await req.user;
    const userDoc = await User.findOne({ id: user.id }); // Use the correct

    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    userDoc.displayName = displayName;

    // Save the updated user
    await userDoc.save();

    res.status(200).json({ code: 1, message: 'Display name updated successfully!' });
  } catch (error) {
    console.error('Error updating display name:', error);
    next(error);
    res.status(500).json({ code: 0, message: 'Failed to update display name. Please try again later.' });
  }
});

router.post('/block/add', async (req, res) => {
  const { myBlockUser, myBlockReason } = req.body;
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'U: Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this request.' });
  }

  if (!myBlockUser || !myBlockReason) {
    return res.status(400).json({ code: 0, message: 'None info.' });
  }

  try {
    // Check if the user is already blocked
    const thisUser = await User.findOne({ id: myBlockUser });
    if (!thisUser) {
      return res.status(404).json({ code: 0, message: 'The user you are trying to block does not exist in database.' })
    }
    const imblocked = await Buser.findOne({ user_id: myBlockUser });
    const blockType = 'YES';
    if (!imblocked) {
      // Create a new block entry
      const newBlock = new Buser({
        user_id: myBlockUser,
        blocked: blockType,
        reason: myBlockReason,
      });

      // Save the new block entry
      await newBlock.save();

      // Return a success response
      res.status(200).json({ code: 1, message: 'User blocked successfully!' });
    } else {
      // Update the existing block entry
      imblocked.blocked = blockType;
      imblocked.reason = myBlockReason;

      // Save the updated block entry
      await imblocked.save();

      // Return a success response
      res.status(200).json({ code: 1, message: 'Updated User blocked successfully!' });
    }
  } catch (error) {
    console.error(error);
    next(error);
    res.status(500).json({ message: 'An error occurred while blocking the user.' });
  }
});

router.put('/unblock', async (req, res) => {
  const { myBlockUser, myBlockReason } = req.body;
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'U: Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this request.' });
  }

  if (!myBlockUser) {
    return res.status(400).json({ code: 0, message: 'None info.' });
  }

  try {
    // Check if the user is already blocked
    let imblocked = await Buser.findOne({ user_id: myBlockUser });
    const blockType = 'NO';

    if (!imblocked) {
      return res.status(404).json({ code: 0, message: 'This user is not blocked.' })
    }
    imblocked.blocked = blockType;

    // Save the blocked user entry
    await imblocked.save();
    res.status(200).json({ code: 1, message: 'User unblocked successfully!', imblocked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while blocking the user.' });
  }
});

router.get('/blocks', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    // Ensure the user is an admin based on their Discord ID
    if (user.id === process.env.ADMIN_ID || user.admin === true) {
      // Fetch all requests if the user is an admin
      const allRequests = await Buser.find();
      return res.status(200).json(allRequests);
    } else {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view these requests.' });
    }
  } catch (error) {
    console.error('Error fetching requests:');
    res.status(500).json({ message: 'Failed to fetch requests. Please try again later.' });
  }
});

router.get('/blocked/:thisUser', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    // Ensure the user is an admin based on their Discord ID
    const { thisUser } = req.params;
    if (user.id === process.env.ADMIN_ID || user.admin === true) {
      // Fetch all requests if the user is an admin
      const allRequests = await Buser.find({ user_id: thisUser });
      if (!allRequests) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(allRequests);
    } else {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view these requests.' });
    }
  } catch (error) {
    console.error('Error fetching requests:');
    res.status(500).json({ message: 'Failed to fetch requests. Please try again later.' });
  }
});

router.delete('/:thisUser', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }
    if (user.id === process.env.ADMIN_ID || user.admin === true) {
      user.isAdmin = true;
    }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this user.' });
  }

  try {
    const { thisUser } = req.params;
    const request = await User.findOneAndDelete({ id: thisUser });

    if (!request) {
      return res.status(404).json({ code: 0, message: 'User not found.' });
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error while deleting request:');
    res.status(500).json({ message: 'Failed to delete request. Please try again later.' });
  }
});

router.delete('/blocked/:thisUser', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }
    if (user.id === process.env.ADMIN_ID) {
      user.isAdmin = true;
    }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this blocked user.' });
  }

  try {
    const { thisUser } = req.params;
    const request = await Buser.findOneAndDelete({ user_id: thisUser });

    if (!request) {
      return res.status(404).json({ code: 0, message: 'Blocked user not found.' });
    }

    res.status(200).json({ message: 'Blocked User deleted successfully.' });
  } catch (error) {
    console.error('Error while deleting request:');
    res.status(500).json({ message: 'Failed to delete request. Please try again later.' });
  }
});

router.get('/:thisUser', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    const { thisUser } = req.params;
    let request = await User.findOne({ id: thisUser });

    if (!request) {
      request = await User.findOne({ username: thisUser });
    }

    if (!request) {
      return res.status(404).json({ code: 0, message: 'User not found.' });
    }

    res.status(200).json({
      username: request.username,
      displayName: request.displayName,
      id: request.id,
      avatarHash: request.avatarHash,
      staff: request.staff,
      admin: request.admin,
    });
  } catch (error) {
    console.error('Error while fetching request:');
    res.status(500).json({ message: 'Failed to fetch user. Please try again later.' });
  }
});

module.exports = router;
