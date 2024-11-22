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
    '/collect/request',
    '/collect/pay',
    '/collect/social',
  ];

  // Ignore `/health` route
  if (req.path === '/health') {
    return next();
  }

  // Log public route access with blue color
  if (publicPaths.includes(req.path)) {
    logRouteUsage(req.path, req.method, 'Public', 0x3498db); // No await
    return next();
  }

  const requestId = '66ce114ad047465fb13c4464';
  const myServer = await Server.findById(requestId);

  if (!myServer) {
    logRouteUsage(req.path, req.method, 'Server Not Found', 0xff0000); // No await
    return res.status(404).json({ message: 'Server not found' });
  }

  if (myServer.serverClosed === 'yesclosed') {
    logRouteUsage(req.path, req.method, 'Server Closed', 0xff0000); // No await
    return res.status(502).json({ message: 'The API and Services are currently unavailable.' });
  }

  const token = req.cookies.token;

  if (!token) {
    logRouteUsage(req.path, req.method, 'Unauthorized - No Token', 0xff0000); // No await
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const blackToken = await Blacklist.findOne({ blacklistToken: token });

  if (blackToken) {
    res.clearCookie('token', { httpOnly: true, secure: true });
    logRouteUsage(req.path, req.method, 'Blacklisted Token', 0xff0000); // No await
    return res.status(403).json({ message: 'You are not allowed to access this API.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      logRouteUsage(req.path, req.method, 'JWT Verification Failed', 0xff0000); // No await
      return res.status(403).json({ message: 'Forbidden' });
    }

    const targetUser = await User.findOne({ id: decodedToken.id }).lean();

    if (!targetUser) {
      logRouteUsage(req.path, req.method, 'User Not Found', 0xff0000); // No await
      return res.status(404).json({ message: 'User not found' });
    }

    const requestsPaths = ['/requests/report', '/requests/support', '/requests/guild'];

    if (requestsPaths.includes(req.path)) {
      try {
        const blockedUser = await Buser.findOne({ user_id: decodedToken.id }).lean();

        if (blockedUser && blockedUser.blocked === 'YES') {
          logRouteUsage(
            req.path,
            req.method,
            `Blocked User - Reason: ${blockedUser.reason}`,
            0xff0000
          ); // No await
          return res
            .status(406)
            .json({ message: 'You are blocked from submitting requests :/', reason: blockedUser.reason });
        }
      } catch (error) {
        logRouteUsage(req.path, req.method, 'Error Checking Blocked Status', 0xff0000); // No await
        return res.status(500).json({ message: 'Error checking blocked status' });
      }

      req.user = targetUser;
      logRouteUsage(req.path, req.method, targetUser.username || 'Unknown User', 0x00ff00); // No await
      return next();
    }

    req.user = targetUser;
    logRouteUsage(req.path, req.method, targetUser.username || 'Unknown User', 0x00ff00); // No await
    next();
  });
};

const logRouteUsage = (path, method, user, color) => {
  const message = {
    embeds: [
      {
        title: "API Route Used",
        color: color,
        fields: [
          { name: "Route:", value: path, inline: true },
          { name: "Method:", value: method, inline: true },
          { name: "Accessed By:", value: user, inline: true },
        ],
        timestamp: new Date(),
      },
    ],
  };

  // Send webhook request asynchronously
  axios.post(POST_LOGS, message).catch((error) => {
    console.error("Error sending message POST LOGS:", error.message);
  });
};

module.exports = authMiddleware;
