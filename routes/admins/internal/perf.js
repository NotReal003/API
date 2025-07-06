// routes/performance/index.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const PerfMetric = mongoose.model("PerfMetric", new mongoose.Schema({
  name: String,
  value: Number,
  delta: Number,
  id: String,
  userAgent: String,
  connection: String,
  timestamp: { type: Date, default: Date.now },
}));

// POST performance metric
router.post("/", async (req, res) => {
  try {
    const metric = new PerfMetric({
      ...req.body,
      userAgent: req.headers['user-agent'] || 'Unknown',
      connection: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });
    await metric.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET performance metrics (admin only)
router.get("/", async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }
  try {
    if (user.admin !== true) {
      return res.status(403).json({ message: "Missing permission..." });
    }
    const metrics = await PerfMetric.find().sort({ timestamp: -1 }).limit(100);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
