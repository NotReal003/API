const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();

// Helper function to get visit count for a specific time range
const getVisitCountForRange = (timestamps, rangeStart) => {
  return timestamps.filter(timestamp => new Date(timestamp) >= rangeStart).length;
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

    // Define time ranges
    const now = new Date();
    const dailyKey = visitTimestamp.toISOString().slice(0, 10); // YYYY-MM-DD
    const weeklyKey = `${now.getFullYear()}-W${Math.ceil(
      (now.getDate() - now.getDay() + 7) / 7
    )}`; // YYYY-WXX
    const monthlyKey = visitTimestamp.toISOString().slice(0, 7); // YYYY-MM

    // Update visit counts for ranges
    const dailyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const weeklyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const monthlyStart = new Date(now.getFullYear(), now.getMonth() - 1);

    countRecord.dailyVisits[dailyKey] = getVisitCountForRange(countRecord.visitTimestamps, dailyStart);
    countRecord.weeklyVisits[weeklyKey] = getVisitCountForRange(countRecord.visitTimestamps, weeklyStart);
    countRecord.monthlyVisits[monthlyKey] = getVisitCountForRange(countRecord.visitTimestamps, monthlyStart);

    await countRecord.save();

    res.status(200).json({ success: true, message: `Visit tracked for ${pageType}` });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ success: false, message: 'Error tracking visit.' });
  }
});

module.exports = router;
