const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Request = require('../../models/Request');
const router = express.Router();
const User = require('../../models/User');

// Submit a Support Request
router.post('/application', async (req, res, next) => {
  const { inGameName, messageLink, additionalInfo } = req.body;
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (!inGameName || !messageLink) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  if (inGameName.length > 16 || inGameName.length < 2) {
    return res.status(400).json({ message: 'The username name must be under 2-16 characters.' });
  }
  if (messageLink.length > 1750 || messageLink.length < 2) {
    return res.status(400).json({ message: 'The reason for joining guild must be under 2-1750 characters.' });
  }
  if (additionalInfo.length > 1750) {
    return res.status(400).json({ message: 'The additional information must be under 1750 characters.' });
  }

  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL1;
    const payload = {
      content: `A new Application from ${user.username} (ID: ${user.id})`,
      embeds: [
        {
          title: 'Application',
          fields: [
            {
              name: 'Username',
              value: inGameName,
            },
            {
              name: 'Reason to Join',
              value: messageLink,
            },
            {
              name: 'Additional Info',
              value: 'Look at the request.',
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      next(error || 'Unable to send application');
      return res.status(500).json({ message: 'The API has an issue. Please try again later...' });
    }

    const request = new Request({
      username: user.username,
      id: user.id,
      type: 'guild-application',
      inGameName,
      messageLink,
      additionalInfo,
      typeName: 'Application',
    });

    await request.save();

    res.status(200).json({ message: 'Application submitted successfully', requestId: request._id });
  } catch (error) {
    next(error);
    console.error('Error:', error);
    res.status(500).json({ message: 'API has an issue, the developer has been notified.' });
  }
});
router.post('/support', async (req, res, next) => {
  const { messageLink, additionalInfo } = req.body;
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (!messageLink) {
    return res.status(400).json({ message: 'Empty message cannot be submitted!' });
  }

  if (messageLink.length > 1750 || messageLink.length < 10) {
    return res.status(400).json({ message: 'The "Your Support Request" must be under 10-1750 characters.' });
  }
  if (additionalInfo.length > 1750) {
    return res.status(400).json({ message: 'The additional information must be under 1750 characters.' });
  }

  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL1;
    const payload = {
      content: `An support application from ${user.username} (ID: ${user.id})`,
      embeds: [
        {
          title: 'Their Request',
          description: messageLink,
          fields: [
            {
              name: 'Additional Info',
              value: 'Look at the request.',
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      next(error || 'Unable to send support quirie');
      return res.status(500).json({ message: 'The API has an issue. Please contact the Admin. ErrorType: No Logs' });
    }

    const request = new Request({
      username: user.username,
      id: user.id,
      type: 'support',
      messageLink,
      additionalInfo,
      typeName: 'Support Querie',
    });

    await request.save();

    res.status(200).json({ message: 'Support request submitted successfully', requestId: request._id });
  } catch (error) {
    console.log(error);
    next(error);
    res.status(500).json({ message: 'API has an issue, the developer has been notified.' });
  }
});

// Submit a Report Request
router.post('/report', async (req, res, next) => {
  const { messageLink, additionalInfo } = req.body;
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (!messageLink) {
    return res.status(400).json({ message: 'Discord Message Link or Evidence is required' });
  }
  if (messageLink.length > 1000 || messageLink.length < 2) {
    return res.status(400).json({ message: 'The Discord Message Link / Evidence must be under 2-1000 characters.' });
  }
  if (additionalInfo.length > 1750) {
    return res.status(400).json({ message: 'The additional information must be under 1750 characters.' });
  }

  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const payload = {
      content: `An report from ${user.username} (ID: ${user.id})`,
      embeds: [
        {
          title: 'Reported Message Link',
          description: messageLink,
          color: 16711680,
          fields: [
            {
              name: 'Additional Info',
              value: 'Look at the request.',
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      next(error || 'Unable to send report');
      return res.status(500).json({ message: 'The API has an issue. Please try again later. ErrorType: No logs' });
    }

    const request = new Request({
      username: user.username,
      id: user.id,
      email: user.email,
      type: 'report',
      messageLink,
      additionalInfo,
      typeName: 'Discord Report',
    });

    await request.save();

    res.status(200).json({ message: 'Report submitted successfully', requestId: request._id });
  } catch (error) {
    next(error);
    res.status(500).json({ message: 'API has an issue. ErrorType: No logs' });
  }
});

// Fetch User's Requests
router.get('/', async (req, res, next) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    // Check if the user is an admin based on their Discord ID
    if (user.id === '1131271104590270606') {
      user.isAdmin = true;
    }

    if (user.isAdmin) {
      // Fetch all requests if the user is an admin
      const allRequests = await Request.find({ id: user.id });
      return res.status(200).json(allRequests);
    } else {
      // Fetch only the requests that belong to the user
      const userRequests = await Request.find({ id: user.id });
      return res.status(200).json(userRequests);
    }
  } catch (error) {
    next(error);
    res.status(500).json({ message: 'Unable to fetch requests, please try again later...' });
  }
});
router.get('/:requestId', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    const { requestId } = req.params;

    if (requestId.length < 24) {
      return res.status(400).json({ code: 0, message: 'RequestID is not vaild.' });
    }
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'This request not found' });
    }

    // Ensure that the user is the owner of the request
    if (request.id === user.id) {
      return res.status(200).json(request);
    } else {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view this request.' });
    }
  } catch (error) {
    console.error('Error fetching request:', error);
    next(error);
    res.status(500).json({ message: 'This request was not found or an error occurred. Please try again later.' });
  }
});

router.patch('/:requestId/cancel', async (req, res, next) => {
  const { requestId } = req.params;
  const user = await req.user;

  try {
    // Fetch the request by ID
    const request = await Request.findById(requestId);

    // Check if request exists
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Check if the user is the owner of the request
    if (request.id !== user.id) {
      return res.status(403).json({ message: 'You do not have permission to manage this request.' });
    }

    if (request.reviewed === 'true') {
      return res.status(406).json({ message: `This request was already ${request.status} :)` });
    }

    request.status = 'CANCELLED';
    request.reviewMessage = 'Self canceled by the requester.';
    request.reviewed = 'true';


    // Save the updated request
    await request.save();

    res.status(200).json({ message: 'This request was canceled successfully.' });
  } catch (error) {
    console.error(error);
    next(error);
    res.status(500).json({ message: 'An error occurred while canceling the request.' });
  }
});

module.exports = router;
