const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();

const allowedPageTypes = ['request', 'pay', 'social'];

router.get('/:pageType', async (req, res, next) => {
  const { pageType } = req.params;

  if (!allowedPageTypes.includes(pageType)) {
    return res.status(400).json({
      success: false,
      message: `"pageType" must be one of the following: ${allowedPageTypes.join(', ')}`,
    });
  }

  const today = new Date().toISOString().split('T')[0]; // Get today's date (YYYY-MM-DD)
  const startOfWeek = new Date(); // Get the start of the current week
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  const weekKey = startOfWeek.toISOString().split('T')[0];

  const monthKey = today.slice(0, 7); // YYYY-MM

  try {
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

    res.status(200).json({ success: true, message: 'Visit tracked successfully.' });
  } catch (error) {
    console.error('Error tracking visit:', error);
    next(error);
    res.status(500).json({ success: false, message: 'Error tracking visit.' });
  }
});

router.get('/request/producthunt', async (req, res) => {
  const pageType = 'producthunt';

  const today = new Date().toISOString().split('T')[0]; // Get today's date (YYYY-MM-DD)
  const startOfWeek = new Date(); // Get the start of the current week
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  const weekKey = startOfWeek.toISOString().split('T')[0];

  const monthKey = today.slice(0, 7); // YYYY-MM

  try {
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

    res.status(200).json({ success: true, message: 'Visit tracked successfully. (productHunt)' });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ success: false, message: 'Error tracking visit.' });
  }
});

module.exports = router;
