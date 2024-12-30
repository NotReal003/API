const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const Server = require('../models/Server');
const User = require('../models/User');
const Buser = require('../models/Buser');
const Blacklist = require('../models/Blacklist');
const Count = require('../models/Count');
//const BannedIP = require('../models/BannedIp');

const POST_LOGS = process.env.WEB_LOGS;

const authMiddleware = async (req, res, next) => {
  const publicPaths = [
    '/auth/signin',
    '/auth/callback',
    '/auth/github/callback',
    '/auth/signout',
    '/auth/user',
    '/auth',
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
    '/source',
    '/Source',
  ];

  const ignorePaths = ['/health'];

  const serverPaths = ['/server/manage-api'];

  if (ignorePaths.includes(req.path)) {
    return next();
  }

  // Log public route access
  if (publicPaths.includes(req.path)) {
    logRouteUsage(req.path, req.method, 'Public', 0x3498db);
    return next();
  }

  if (serverPaths.includes(req.path)) {
    logRouteUsage(req.path, req.method, 'Server', 0x11806a);
    return next();
  }

  //const requestId = '66ce114ad047465fb13c4464';
  //const myServer = await Server.findById(requestId);

  //if (!myServer) {
  //  logRouteUsage(req.path, req.method, 'Server Not Found', 0xff0000);
  //  return res.status(404).json({ message: 'Server not found' });
  //}

  //if (myServer.serverClosed === 'yesclosed') {
//    logRouteUsage(req.path, req.method, 'Server Closed', 0xff0000);
//    return res.status(502).json({ message: 'The API and Services are currently unavailable.' });
//  }

  const token = req.cookies.token || req.headers['authorization'];

  if (!token) {
    logRouteUsage(req.path, req.method, 'Unauthorized - No Token', 0xff0000);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const blackToken = await Blacklist.findOne({ blacklistToken: token });

  if (blackToken) {
    res.clearCookie('token', { httpOnly: true, secure: true });
    logRouteUsage(req.path, req.method, 'Blacklisted Token', 0xff0000);
    return res.status(403).json({ message: 'Your session has expired. Please login again.' });
  }
//  const clientIp =
//    req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//
//  // Check for banned subnets
//  const [ipBase] = clientIp.split('.').slice(0, 3); // Extract "152.59.16"
//  const subnetPattern = `${ipBase}.*`;

//  const bannedIp = await BannedIP.findOne({
//    $or: [
//      { ipAddress: clientIp }, // Exact match
//      { ipAddress: subnetPattern }, // Subnet match
//    ],
//  });
//
//  if (bannedIp) {
//    logRouteUsage(req.path, req.method, 'Banned IP/Subnet', 0xff0000);
//    return res.status(403).json({ message: 'Your IP has been banned by our services…' });
//  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      logRouteUsage(req.path, req.method, 'JWT Verification Failed', 0xff0000);
      return res.status(403).json({ message: 'Forbidden' });
    }

    const targetUser = await User.findOne({ id: decodedToken.id }).lean();

    if (!targetUser) {
      logRouteUsage(req.path, req.method, 'User Not Found', 0xff0000);
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
          );
          return res
            .status(406)
            .json({ message: 'You are blocked from submitting requests :/', reason: blockedUser.reason });
        }
      } catch (error) {
        logRouteUsage(req.path, req.method, 'Error Checking Blocked Status', 0xff0000);
        return res.status(500).json({ message: 'Error checking blocked status' });
      }

      req.user = targetUser;
      logRouteUsage(req.path, req.method, targetUser.username || 'Unknown User', 0x00ff00);
      return next();
    }

    req.user = targetUser;
    logRouteUsage(req.path, req.method, targetUser.username || 'Unknown User', 0x00ff00);
    next();
  });
};

const notFoundHandler = (req, res) => {
  logRouteUsage(req.path, req.method, 'Not Found', 0xe74c3c);
  res.status(404).json({ message: 'Not Found' });
};

const logRouteUsage = (path, method, user, color) => {
  const today = new Date().toISOString().split('T')[0];
  const message = {
    embeds: [
      {
        title: 'API Route Used',
        color: color,
        fields: [
          { name: 'Route:', value: path, inline: true },
          { name: 'Method:', value: method, inline: true },
          { name: 'Accessed By:', value: user, inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // Fire-and-forget logging to Discord webhook
  axios.post(POST_LOGS, message).catch((error) => {
    console.error('Error sending message POST LOGS:', error.message);
  });

  // Fire-and-forget logging to Count
   (async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekKey = startOfWeek.toISOString().split('T')[0];
    const monthKey = today.slice(0, 7); // YYYY-MM

    try {
      const pageType = 'api';
      let countRecord = await Count.findOne({ pageType });

      if (!countRecord) {
        countRecord = new Count({
          pageType,
          totalVisits: 0,
          dailyVisits: {},
          weeklyVisits: {},
          monthlyVisits: {},
        });
      }

      // Update total visits
      countRecord.totalVisits += 1;

      // Update daily visits
      countRecord.dailyVisits.set(today, (countRecord.dailyVisits.get(today) || 0) + 1);

      // Update weekly visits
      countRecord.weeklyVisits.set(weekKey, (countRecord.weeklyVisits.get(weekKey) || 0) + 1);

      // Update monthly visits
      countRecord.monthlyVisits.set(monthKey, (countRecord.monthlyVisits.get(monthKey) || 0) + 1);

      await countRecord.save();
    } catch (error) {
      console.error('Error tracking API visit:', error);
    }
  })();
};

module.exports = { authMiddleware, notFoundHandler };
