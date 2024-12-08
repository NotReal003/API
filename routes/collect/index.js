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

  // check if user is Admin
  if (user.admin === true || user.id === process.env.ADMIN_ID) {
    isAdmin = true;
  }

  if (!isAdmin) {
    return res.status(403).json({ message: 'You cannot view this page' });
  }
  
  try {
    const counts = await Count.find({});
    const visitLogs = await VisitLog.find({});

    const totalVisits = counts.reduce((sum, record) => sum + record.visits, 0);
    const uniqueVisitors = counts.reduce((sum, record) => sum + record.uniqueVisitors, 0);

    const referrerStats = counts.reduce((map, record) => {
      for (const [referrer, count] of Object.entries(record.referrerStats)) {
        map[referrer] = (map[referrer] || 0) + count;
      }
      return map;
    }, {});

    // Device usage stats
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

    // Response
    res.status(200).json({
      success: true,
      totalVisits,
      uniqueVisitors,
      referrerStats,
      deviceStats,
      browserStats,
      dailyTrends,
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


router.get('/track/:pageType', async (req, res) => {
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

    res.status(200).json({ success: true, message: 'Visit tracked successfully.' });
  } catch (error) {
    //console.error('Error tracking visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking visit.',
    });
  }
});


module.exports = router;
