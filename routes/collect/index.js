const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();
const Player = require('../../models/Player');
const axios = require('axios');

const allowedPageTypes = ['request', 'pay', 'social'];

router.patch("/players", async (req, res) => {
//  const { name } = req.params;
  const { name, xuid, avatar } = req.body;
  const playerData = {
  name,
  xuid,
  avatar
};


  if (!name || !xuid || !avatar) {
    return res.status(400).json({ error: "Missing name, xuid, or avatar", playerData });
  }

  try {
    const pResponse = await axios.get(`https://ngmc.co/v1/players/${name}`);

    if (pResponse.status !== 200) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const player = await Player.findOneAndUpdate(
      { name },
      {
        $set: { xuid, avatar },
        $inc: { searchCount: 1 },
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Player log updated", player });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.get("/players", async (req, res) => {
  try {
    const players = await Player.find().sort({ searchCount: -1 }); // Optional: sort by most searched
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

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
