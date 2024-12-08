const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();
const VisitLog = require('../../models/VisitLog');

// Allowed page types
const allowedPageTypes = ['request', 'pay', 'social'];


router.get('/visits', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401);
  }
  
  if (user.admin !== true) {
    return res.status(403);
  }
  try {
    // Fetch all count records from the database
    const countRecords = await Count.find();

    // Initialize variables for total stats
    let totalVisits = 0;
    let uniqueVisitors = 0;
    const pageStats = {};
    const deviceStats = {};
    const browserStats = {};
    const referrerStats = {};

    // Loop through all count records to aggregate data
    for (const record of countRecords) {
      totalVisits += record.visits;

      // Aggregating page-type stats
      pageStats[record.pageType] = pageStats[record.pageType] || 0;
      pageStats[record.pageType] += record.visits;

      // Aggregating device stats
      for (const [device, count] of Object.entries(record.deviceStats)) {
        deviceStats[device] = (deviceStats[device] || 0) + count;
      }

      // Aggregating browser stats
      for (const [browser, count] of Object.entries(record.browserStats)) {
        browserStats[browser] = (browserStats[browser] || 0) + count;
      }

      // Aggregating referrer stats
      for (const [referrer, count] of Object.entries(record.referrerStats)) {
        referrerStats[referrer] = (referrerStats[referrer] || 0) + count;
      }

      // Assuming unique visitors are tracked by IP (basic example)
      uniqueVisitors += Object.keys(record.referrerStats).length; // Approximation
    }

    // Prepare the response object
    const response = {
      success: true,
      totalVisits,
      uniqueVisitors,
      pageStats,
      deviceStats,
      browserStats,
      referrerStats,
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching visit data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visit data.',
      error: error.message,
    });
  }
});

router.get('/:pageType', async (req, res) => {
  const { pageType } = req.params;

  // Validate pageType
  if (!allowedPageTypes.includes(pageType)) {
    return res.status(400).json({
      success: false,
      message: `"pageType" must be one of the following: ${allowedPageTypes.join(', ')}`,
    });
  }

  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    const timestamp = new Date();
    const referrer = req.headers.referer || 'Direct';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const deviceType = /mobile/i.test(userAgent) ? 'Mobile' : /tablet/i.test(userAgent) ? 'Tablet' : 'Desktop';
    const browserName = /chrome/i.test(userAgent)
      ? 'Chrome'
      : /firefox/i.test(userAgent)
      ? 'Firefox'
      : 'Other';

    // Fetch or create count record for the specific page type
    let countRecord = await Count.findOne({ pageType });
    if (!countRecord) {
      countRecord = new Count({
        pageType,
        visits: 0,
        uniqueVisitors: 0,
        deviceStats: {},
        browserStats: {},
        referrerStats: {},
        dailyVisits: new Map(),
      });
    }

    // Increment visit counters
    countRecord.visits += 1;
    countRecord.deviceStats[deviceType] = (countRecord.deviceStats[deviceType] || 0) + 1;
    countRecord.browserStats[browserName] = (countRecord.browserStats[browserName] || 0) + 1;
    countRecord.referrerStats[referrer] = (countRecord.referrerStats[referrer] || 0) + 1;

    // Update daily visits (in a Map, keyed by date)
    const today = new Date().toISOString().split('T')[0];
    countRecord.dailyVisits.set(today, (countRecord.dailyVisits.get(today) || 0) + 1);

    // Save the updated count record
    await countRecord.save();

    // Prepare cleaned response data
    const cleanedResponse = {
      success: true,
      totalVisits: countRecord.visits,
      uniqueVisitors: countRecord.uniqueVisitors,
      referrerStats: countRecord.referrerStats,
      deviceStats: countRecord.deviceStats,
      browserStats: countRecord.browserStats,
      dailyTrends: Array.from(countRecord.dailyVisits.entries()).map(([date, count]) => ({
        date,
        visits: count,
      })),
      topVisitors: [], // You can aggregate this from the referrerStats or deviceStats if needed
    };

    // Send the response
    res.status(200).json(cleanedResponse);

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
