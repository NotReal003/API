const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const Server = require('../models/Server');
const User = require('../models/User');
const Buser = require('../models/Buser');
const Blacklist = require('../models/Blacklist');

const POST_LOGS = process.env.WEB_LOGS;

const authMiddleware = async (req, res, next) => {
  const publicPaths = [
    '/auth/signin', 
    '/auth/callback', 
    '/auth/github/callback',
    '/auth/signout', 
    '/auth/user', 
    '/server/manage-api',
    '/health',
    '/auth/email-signup',
    '/auth/email-signin',
    '/auth/verify-email',
    '/auth/verify-signin-email-code',
    '/auth/email-signin-verify',
    '/auth/github',
    '/collect',
  ];

  if (publicPaths.includes(req.path)) {
    await logRouteUsage(req.path, req.method, 'Public');
    return next();
  }

  const requestId = '66ce114ad047465fb13c4464';
  const myServer = await Server.findById(requestId);

  if (!myServer) {
    return res.status(404).json({ message: 'Server not found' });
  }

  if (myServer.serverClosed === 'yesclosed') {
    return res.status(502).json({ message: 'The API and Services are currently unavailable.' });
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const blackToken = await Blacklist.findOne({ blacklistToken: token });

  if (blackToken) {
    res.clearCookie('token', { httpOnly: true, secure: true });
    return res.status(403).json({ message: 'You are not allowed to access this API.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const targetUser = await User.findOne({ id: decodedToken.id }).lean();

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requestsPaths = ['/requests/report', '/requests/support', '/requests/guild'];

    if (requestsPaths.includes(req.path)) {
      try {
        const blockedUser = await Buser.findOne({ user_id: decodedToken.id }).lean();

        if (blockedUser && blockedUser.blocked === 'YES') {
          return res.status(406).json({ message: 'You are blocked from submitting requests :/', reason: blockedUser.reason });
        }
      } catch (error) {
        return res.status(500).json({ message: 'Error checking blocked status' });
      }

      req.user = targetUser;
      await logRouteUsage(req.path, req.method, targetUser.username || 'Unknown User');
      return next();
    }

    req.user = targetUser;
    await logRouteUsage(req.path, req.method, targetUser.username || 'Unknown User');
    next();
  });
};

const logRouteUsage = async (path, method, user) => {
  const message = {
    embeds: [
      {
        title: "API Route Used",
        color: 0x3498db,
        fields: [
          { name: "Route:", value: path, inline: true },
          { name: "Method:", value: method, inline: true },
          { name: "Accessed By:", value: user, inline: true },
        ],
        timestamp: new Date(),
      },
    ],
  };

  try {
    await axios.post(POST_LOGS, message);
  } catch (error) {
    console.error("Error sending message POST LOGS:", error.message);
  }
};

module.exports = authMiddleware;
