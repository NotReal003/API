const express = require('express');
const Count = require('../../models/Count');
const router = express.Router();

// Allowed page types
const allowedPageTypes = ['request', 'pay', 'social'];

// Route to count and increment visits for specific pages

router.get('/visits', async (req, res) => {
  const { pageType } = req.query;
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (user.admin !== true) {
    return res.status(403).json({ message: 'You do not have permission to view this area.'});
  }

  try {
    if (pageType) {
      // Validate the pageType
      if (!allowedPageTypes.includes(pageType)) {
        return res.status(400).json({
          success: false,
          message: `"pageType" must be one of the following: ${allowedPageTypes.join(', ')}`,
        });
      }

      // Fetch the count for the specific pageType
      const countRecord = await Count.findOne({ pageType }) || { visits: 0 };
      return res.status(200).json({
        success: true,
        pageType,
        visits: countRecord.visits,
      });
    }

    // Fetch counts for all allowed page types
    const counts = await Count.find({ pageType: { $in: allowedPageTypes } });
    const response = allowedPageTypes.map((type) => {
      const record = counts.find((count) => count.pageType === type) || { visits: 0 };
      return { pageType: type, visits: record.visits };
    });

    res.status(200).json({
      success: true,
      counts: response,
    });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visit counts.',
      error: error.message,
    });
  }
});

router.get('/:pageType', async (req, res) => {
  const { pageType } = req.params;

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
