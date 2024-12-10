const BannedIP = require('../models/BannedIp');

const ipBanMiddleware = async (req, res, next) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const bannedIp = await BannedIP.findOne({ ipAddress: clientIp });
    if (bannedIp) {
      return res.status(403).json({ message: 'Your IP has been banned by our services…' });
    }
    next();
  } catch (error) {
    console.error('Error checking IP ban:', error);
    res.status(500).json({ message: 'IP: Internal server error.' });
  }
};

module.exports = ipBanMiddleware;
