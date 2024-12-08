const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();
const VisitLog = require('../../models/VisitLog');

// Allowed page types
const allowedPageTypes = ['request', 'pay', 'social', 'api'];

// Route to count and increment visits for specific pages

router.get('/visits', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let isAdmin = false;
  if (user.admin === true || user.id === process.env.ADMIN_ID) {
    isAdmin = true;
  }

  if (!isAdmin) {
    return res.status(403).json({ message: 'You cannot view this page' });
  }

  try {
    const counts = await Count.find({});
    const visitLogs = await VisitLog.find({}).sort({ visitTime: -1 });

    const totalVisits = counts.reduce((sum, record) => sum + record.visits, 0);
    const uniqueVisitors = counts.reduce((sum, record) => sum + record.uniqueVisitors, 0);

    const referrerStats = counts.reduce((map, record) => {
      for (const [referrer, count] of Object.entries(record.referrerStats)) {
        map[referrer] = (map[referrer] || 0) + count;
      }
      return map;
    }, {});

    const deviceStats = counts.reduce((map, record) => {
      for (const [device, count] of Object.entries(record.deviceStats)) {
        map[device] = (map[device] || 0) + count;
      }
      return map;
    }, {});

    const browserStats = counts.reduce((map, record) => {
      for (const [browser, count] of Object.entries(record.browserStats)) {
        map[browser] = (map[browser] || 0) + count;
      }
      return map;
    }, {});

    const dailyTrends = counts.reduce((map, record) => {
      for (const [date, count] of Object.entries(record.dailyVisits)) {
        map[date] = (map[date] || 0) + count;
      }
      return map;
    }, {});

    // Insights from VisitLog
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

    // Response
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
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const timestamp = new Date();
    const referrer = req.headers.referer || 'Direct';
    const userAgent = req.headers['user-agent'];

    // Extract device and browser info
    const deviceType = /mobile/i.test(userAgent) ? 'Mobile' : /tablet/i.test(userAgent) ? 'Tablet' : 'Desktop';
    const browserName = /chrome/i.test(userAgent) ? 'Chrome' : /firefox/i.test(userAgent) ? 'Firefox' : 'Unknown';

    const location = {
      country: 'Unknown',
      city: 'Unknown',
    };

    //
    let countRecord = await Count.findOne({ pageType });
    if (!countRecord) {
      countRecord = new Count({ pageType });
    }

    //
    countRecord.visits += 1;
    countRecord.deviceStats[deviceType] = (countRecord.deviceStats[deviceType] || 0) + 1;
    countRecord.browserStats[browserName] = (countRecord.browserStats[browserName] || 0) + 1;
    countRecord.referrerStats[referrer] = (countRecord.referrerStats[referrer] || 0) + 1;

    //
    const date = formatDate(timestamp);
    countRecord.dailyVisits.set(date, (countRecord.dailyVisits.get(date) || 0) + 1);

    await countRecord.save();

    //
    const visitLog = new VisitLog({
      pageType,
      ip,
      timestamp,
      referrer,
      deviceType,
      browserName,
      location,
    });
    await visitLog.save();

    res.status(200).json({ success: true, message: 'OK' });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking visit.',
      error: error.message,
    });
  }
});


module.exports = router;
