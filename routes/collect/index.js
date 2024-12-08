const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();

const allowedPageTypes = ['request', 'pay', 'social'];

router.get('/:pageType', async (req, res) => {
  const { pageType } = req.params;

  if (!allowedPageTypes.includes(pageType)) {
    return res.status(400).json({
      success: false,
      message: `"pageType" must be one of the following: ${allowedPageTypes.join(', ')}`,
    });
  }

  const today = new Date().toISOString().split('T')[0]; // Get today's date (YYYY-MM-DD)

  try {
    // Find or create a document for the pageType
    let countRecord = await Count.findOne({ pageType });

    if (!countRecord) {
      countRecord = new Count({
        pageType,
        totalVisits: 0,
        dailyVisits: {},
        weeklyVisits: 0,
        monthlyVisits: 0,
      });
    }

    // Update total visits
    countRecord.totalVisits += 1;

    // Update daily visits
    countRecord.dailyVisits.set(today, (countRecord.dailyVisits.get(today) || 0) + 1);

    // Update weekly and monthly visits
    const last7Days = Array.from(countRecord.dailyVisits.entries())
      .filter(([date]) => new Date(date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, [, count]) => sum + count, 0);

    const last30Days = Array.from(countRecord.dailyVisits.entries())
      .filter(([date]) => new Date(date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, [, count]) => sum + count, 0);

    countRecord.weeklyVisits = last7Days;
    countRecord.monthlyVisits = last30Days;

    await countRecord.save();

    res.status(200).json({ success: true, message: 'Visit tracked successfully.' });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ success: false, message: 'Error tracking visit.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const counts = await Count.find();
    res.status(200).json({ success: true, counts });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics.' });
  }
});

module.exports = router;
