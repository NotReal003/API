const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();

// Allowed page types
const allowedPageTypes = ['request', 'pay', 'social'];

// Route to count and increment visits for specific pages
router.get('/', async (req, res) => {
  const { pageType } = req.query;

  // Validate the pageType parameter
  if (!pageType) {
    return res.status(400).json({
      success: false,
      message: 'Missing "pageType" query parameter.',
    });
  }

  if (!allowedPageTypes.includes(pageType)) {
    return res.status(400).json({
      success: false,
      message: `"pageType" must be one of the following: ${allowedPageTypes.join(', ')}`,
    });
  }

  try {
    // Find the record for the specific pageType (or create it if it doesn't exist)
    let countRecord = await Count.findOne({ pageType });

    if (!countRecord) {
      // Create the record if it doesn't exist
      countRecord = new Count({ visits: 0, pageType });
    }

    // Increment the visit count
    countRecord.visits += 1;

    await countRecord.save();

    res.status(200).json({
      success: true,
      message: `OK`,
    });
  } catch (error) {
    // Handle any errors
    console.error('Error tracking visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking visits.',
      error: error.message,
    });
  }
});

module.exports = router;
