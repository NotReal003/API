const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();
const Player = require('../../models/Player');
const axios = require('axios');

const allowedPageTypes = ['request', 'pay', 'social'];

router.patch("/players", async (req, res) => {
  const playerId = req.body.xuid;

  if (!playerId) {
    return res.status(400).json({ error: "Missing xuid", message: "Player xuid is required" });
  }

  try {
    const { data } = await axios.get(`https://api.ngmc.co/v1/players/${playerId}`);

    if (!data.xuid) {
      return res.status(404).json({ error: "Player not found in response" });
    }

    const xuid = data.xuid;
    const name = data.name;
    const avatar = data.avatar;

    const existingPlayer = await Player.findOne({ xuid });
    const now = new Date();

    let shouldIncrement = true;

    if (existingPlayer) {
      const lastUpdated = new Date(existingPlayer.updatedAt);
      const secondsSinceLastUpdate = (now - lastUpdated) / 1000;

      if (secondsSinceLastUpdate < 5) {
        shouldIncrement = false;
      }
    }

    const updateData = {
      $set: { name, avatar },
    };

    if (shouldIncrement) {
      updateData.$inc = { searchCount: 1 };
    }

    const player = await Player.findOneAndUpdate(
      { xuid },
      updateData,
      { new: true, upsert: true }
    );

    res.json({
      message: shouldIncrement
        ? "Player log updated"
        : "Player fetched, cooldown active (no count increment)",
      player,
    });

  } catch (error) {
    console.error(error);
    if (error.response && error.response.status === 404) {
      const response = error.response || "API ERROR";
      return res.status(404).json({ apingmc: response, error: "404: Not Found", message: "Player not found on NetherGames Network" });
    }
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
