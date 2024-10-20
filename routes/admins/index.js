const express = require('express');
const router = express.Router();
const axios = require('axios');
const Request = require('../../models/Request');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const User = require('../../models/User');

router.delete('/:requestId', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }
    if (user.id === process.env.ADMIN_ID) {
      user.isAdmin = true;
    }
    
  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this request.' });
  }

  try {
    const { requestId } = req.params;
    const request = await Request.findByIdAndDelete(requestId);

    if (!request) {
      return res.status(404).json({ code: 0, message: 'Request not found.' });
    }

    res.status(200).json({ message: 'Request deleted successfully.' });
  } catch (error) {
    console.error('Error while deleting request:');
    res.status(500).json({ message: 'Failed to delete request. Please try again later.' });
  }
});

router.put('/:requestId', async (req, res) => {
  const user = await req.user;
  const { requestId } = req.params;
  const { status, reviewMessage } = req.body;

  if (!['APPROVED', 'DENIED', 'PENDING', 'CANCELLED', 'RESOLVED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status given' });
  }

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this request.' });
  }

  try {
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    request.reviewed = true;
    if (reviewMessage) {
      request.reviewMessage = reviewMessage;
    }
    await request.save();

    const webhookUrl = process.env.WEB_TOKEN; // Replace with your Discord webhook URL
    const discordMessage = {
      content: `Hey <@${request.id}>! Your request has been updated :) Check it at https://request.notreal003.xyz/one`,
    };

    await axios.post(webhookUrl, discordMessage);

    res.status(200).json({ message: `Request successfully updated to ${request.status}!` });
  } catch (error) {
    console.error('Error updating request:');
    res.status(500).json({ message: 'There was an error while updating the request. Please try again later.' });
  }
});


router.get('/requests', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    // Ensure the user is an admin based on their Discord ID
    if (user.id === process.env.ADMIN_ID || user.isAdmin) {
      // Fetch all requests if the user is an admin
      const allRequests = await Request.find();
      return res.status(200).json(allRequests);
    } else {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view these requests.' });
    }
  } catch (error) {
    console.error('Error fetching requests:');
    res.status(500).json({ message: 'Failed to fetch requests. Please try again later.' });
  }
});

router.get('/requests/:requestId', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'This request not found' });
    }

    // Ensure that the user is an admin
    if (user.id === '1131271104590270606' || user.isAdmin) {
      return res.status(200).json(request);
    } else {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view this request.' });
    }
  } catch (error) {
    console.error('Error fetching request:');
    res.status(500).json({ message: 'Failed to fetch request. Please try again later.' });
  }
});

router.post('/send/email', async (req, res) => {
  const { requestId, reviewMessage, status } = req.body;
  const user = await req.user;

  if (!user) {
      return res.status(403).json({ code: 0, message: 'A: Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID) {
      user.isAdmin = true;
  }

  if (!user.isAdmin) {
      return res.status(403).json({ code: 0, message: 'You do not have permission to manage this request.' });
  }

  try {
      const myRequest = await Request.findById(requestId);
      const myUser = await User.findOne({ id: myRequest.id });
      const templatePath = path.join(__dirname, 'send.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      htmlTemplate = htmlTemplate.replace('{{username}}', myUser.username);
      htmlTemplate = htmlTemplate.replace('{{requestId}}', requestId);
      htmlTemplate = htmlTemplate.replace('{{requestIda}}', requestId);
      htmlTemplate = htmlTemplate.replace('{{reviewMessage}}', reviewMessage || "No review message provided.");
      htmlTemplate = htmlTemplate.replace('{{status}}', status);
      htmlTemplate = htmlTemplate.replace('{{requestName}}', myRequest.typeName);

      // Configure with Gmail
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL,
              pass: process.env.EPASS // Ensure this
          }
      });

      // Send the email
      await transporter.sendMail({
          from: `"Requests Page | NotReal003" <${process.env.EMAIL}>`,
          to: myUser.email,
          subject: `Your ${myRequest.typeName} has been updated.`,
          html: htmlTemplate
      });

      res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Failed to send email. Please try again later.' });
  }
});

module.exports = router;
