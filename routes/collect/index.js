const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();
const VisitLog = require('../../models/VisitLog');

// Allowed page types
const allowedPageTypes = ['request', 'pay', 'social'];

// Route to count and increment visits for specific pages
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; 
};


router.get('/visits', async (req, res) => {
  try {
    const counts = await Count.find({});
    const visitLogs = await VisitLog.find({}).sort({ visitTime: -1 });

    const totalVisits = counts.reduce((sum, record) => sum + record.visits, 0);
    const uniqueVisitors = counts.reduce((sum, record) => sum + record.uniqueVisitors, 0);

    const referrerStats = Object.fromEntries(
      counts.flatMap(record => Object.entries(record.referrerStats || {}))
    );

    const deviceStats = Object.fromEntries(
      counts.flatMap(record => Object.entries(record.deviceStats || {}))
    );

    const browserStats = Object.fromEntries(
      counts.flatMap(record => Object.entries(record.browserStats || {}))
    );

    const dailyTrends = Object.fromEntries(
      counts.flatMap(record => Object.entries(record.dailyVisits || {}))
    );

    const recentVisits = visitLogs.slice(0, 10).map(log => ({
      ipAddress: log.ipAddress,
      visitTime: log.visitTime,
      referrer: log.referrer,
      device: log.device,
      browser: log.browser,
    }));

    const frequentVisitors = visitLogs.reduce((map, log) => {
      map[log.ipAddress] = (map[log.ipAddress] || 0) + 1;
      return map;
    }, {});

    const topVisitors = Object.entries(frequentVisitors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ipAddress: ip, visitCount: count }));

    res.status(200).json({
      success: true,
      totalVisits,
      uniqueVisitors,
      referrerStats,
      deviceStats,
      browserStats,
      dailyTrends,
      recentVisits,
      topVisitors,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics.',
      error: error.message,
    });
  }
});


router.get('/:pageType', async (req, res) => {
  const { pageType } = req.params;

  if (!allowedPageTypes.includes(pageType)) {
    return res.status(400).json({
      success: false,
      message: `"pageType" must be one of the following: ${allowedPageTypes.join(', ')}`,
    });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    const timestamp = new Date();
    const referrer = req.headers.referer || 'Direct';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Simple device and browser detection
    const deviceType = /mobile/i.test(userAgent) ? 'Mobile' : /tablet/i.test(userAgent) ? 'Tablet' : 'Desktop';
    const browserName = /chrome/i.test(userAgent)
      ? 'Chrome'
      : /firefox/i.test(userAgent)
      ? 'Firefox'
      : 'Other';

    // Find or create Count record
    let countRecord = await Count.findOne({ pageType });
    if (!countRecord) {
      countRecord = new Count({
        pageType,
        visits: 0,
        deviceStats: {},
        browserStats: {},
        referrerStats: {},
        dailyVisits: new Map(),
      });
    }

    // Update stats
    countRecord.visits += 1;
    countRecord.deviceStats[deviceType] = (countRecord.deviceStats[deviceType] || 0) + 1;
    countRecord.browserStats[browserName] = (countRecord.browserStats[browserName] || 0) + 1;
    countRecord.referrerStats[referrer] = (countRecord.referrerStats[referrer] || 0) + 1;

    // Increment daily visit count
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    countRecord.dailyVisits.set(today, (countRecord.dailyVisits.get(today) || 0) + 1);

    await countRecord.save();

    // Save visit log
    const visitLog = new VisitLog({
      pageType,
      ip,
      timestamp,
      referrer,
      deviceType,
      browserName,
    });
    await visitLog.save();

    res.status(200).json({ success: true, message: 'Visit logged successfully.' });
  } catch (error) {
    console.error('Error tracking visit:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error logging the visit.',
      error: error.message,
    });
  }
});

module.exports = router;
