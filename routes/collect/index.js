const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();

// Helper function to get visit count for a specific time range
const getVisitCountForRange = (timestamps, range) => {
  const now = new Date();
  const rangeStart = new Date();
  if (range === 'daily') {
    rangeStart.setDate(now.getDate() - 1); // 1 day ago
  } else if (range === 'weekly') {
    rangeStart.setDate(now.getDate() - 7); // 1 week ago
  } else if (range === 'monthly') {
    rangeStart.setMonth(now.getMonth() - 1); // 1 month ago
  }

  return timestamps.filter(timestamp => timestamp >= rangeStart).length;
};

const allowedPageTypes = ['request', 'pay', 'social'];

router.get('/:pageType', async (req, res) => {
  const { pageType } = req.params;
  const referrer = req.get('Referrer');
  const visitTimestamp = new Date();

  if (!allowedPageTypes.includes(pageType)) {
    return res.status(400).json({
      success: false,
      message: `"pageType" must be one of the following: ${allowedPageTypes.join(', ')}`,
    });
  }

  try {
    // Find or create a document for the pageType
    let countRecord = await Count.findOne({ pageType });

    if (!countRecord) {
      countRecord = new Count({
        pageType,
        visits: 0,
        referrerStats: {},
        dailyVisits: {},
        weeklyVisits: {},
        monthlyVisits: {},
        visitTimestamps: [],
      });
    }

    // Increment the visit count for the page
    countRecord.visits += 1;
    countRecord.visitTimestamps.push(visitTimestamp);

    // Track referrer stats
    if (referrer) {
      countRecord.referrerStats[referrer] = (countRecord.referrerStats[referrer] || 0) + 1;
    }

    // Update daily, weekly, and monthly visits
    countRecord.dailyVisits[visitTimestamp.toISOString().slice(0, 10)] = getVisitCountForRange(countRecord.visitTimestamps, 'daily');
    countRecord.weeklyVisits[visitTimestamp.toISOString().slice(0, 7)] = getVisitCountForRange(countRecord.visitTimestamps, 'weekly');
    countRecord.monthlyVisits[visitTimestamp.toISOString().slice(0, 7)] = getVisitCountForRange(countRecord.visitTimestamps, 'monthly');

    await countRecord.save();

    res.status(200).json({ success: true, message: `Visit tracked for ${pageType}` });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ success: false, message: 'Error tracking visit.' });
  }
});

router.get('/visits', async (req, res) => {

  const user = await req.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (user.admin !== true) {
    return res.status(403).json({ message: 'You do not have permission to view this area.'});
  }
  
  try {
    const countRecords = await Count.find();

    let pageStats = {};

    countRecords.forEach((record) => {
      if (record.pageType) {
        if (!pageStats[record.pageType]) {
          pageStats[record.pageType] = {
            daily: [],
            weekly: [],
            monthly: [],
          };
        }

        pageStats[record.pageType].daily = Object.entries(record.dailyVisits);
        pageStats[record.pageType].weekly = Object.entries(record.weeklyVisits);
        pageStats[record.pageType].monthly = Object.entries(record.monthlyVisits);
      }
    });

    res.status(200).json({
      success: true,
      pageStats,
    });
  } catch (error) {
    console.error('Error fetching visit data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visit data.',
    });
  }
});

module.exports = router;
