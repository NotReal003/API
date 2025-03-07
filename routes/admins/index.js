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
    if (user.admin === true) {
      user.isAdmin = true;
    }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to delete this request.' });
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

router.delete('/requests/:userId', async (req, res) => {
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }
  if (user.admin === true) {
    user.isAdmin = true;
  }

  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to delete these requests.' });
  }

  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ code: 0, message: 'Invalid user ID.' });
    }

    // Delete all requests for the specified user
    const deleteResult = await Request.deleteMany({ id: userId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ code: 0, message: 'No requests found for this user.' });
    }

    res.status(200).json({ message: `Successfully deleted ${deleteResult.deletedCount} requests for user.` });
  } catch (error) {
    console.error('Error while deleting requests:', error);
    res.status(500).json({ message: 'Failed to delete requests. Please try again later.' });
  }
});

router.patch('/:requestId', async (req, res) => {
  const user = await req.user;
  const { requestId } = req.params;
  const { status } = req.body;
  let { reviewMessage } = req.body;

  if (!['APPROVED', 'DENIED', 'PENDING', 'CANCELLED', 'RESOLVED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status given' });
  }

  if (!user) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (user.staff === true || user.admin === true) {
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

    const requestUser = await User.findOne({ id: request.id });
    if (!requestUser) {
      return res.status(404).json({ message: 'Request user not found' });
    }

    if (request.status === 'PENDING' && request.status === status) {
      return res.status(400).json({ message: `This request is already ${request.status}!` });
    }

    request.status = status;
    request.reviewed = true;
    if (reviewMessage) {
      request.reviewMessage = reviewMessage;
    }
    await request.save();

    // Define the message based on the user's authentication type
    const messageContent =
      requestUser.authType === 'discord'
        ? `Hey <@${request.id}>! Your request has been updated 🙂\nCheck your request here: [View Request](https://request.notreal003.xyz/requestdetail?id=${request._id})`
        : `Hey ${requestUser.username}! Your request has been updated 🙂\nCheck your request here: [View Request](https://request.notreal003.xyz/requestdetail?id=${request._id})`;

    // Send Discord message if user authType is discord
    const webhookUrl = process.env.WEB_TOKEN;
    const discordMessage = { content: messageContent };

    await axios.post(webhookUrl, discordMessage).catch(err => {
      console.error('Failed to send Discord notification:', err);
    });

    res.status(200).json({ message: `Request successfully updated to ${request.status}!` });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'There was an error while updating the request. Please try again later.' });
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
    if (user.admin === true || user.staff === true) {
      return res.status(200).json(request);
    } else {
      return res.status(403).json({ code: 0, message: 'You do not have permission to view this request.' });
    }
  } catch (error) {
    console.error('Error fetching request:');
    res.status(500).json({ message: 'Failed to fetch request. Please try again later.' });
  }
});

const formatForEmail = (input) => {
  return input.replace(/\n/g, '<br>');
};

router.post('/send/email', async (req, res) => {
  const { requestId } = req.body;
  const user = await req.user;

  if (!user) {
      return res.status(403).json({ code: 0, message: 'A: Unauthorized' });
  }

  if (user.admin === true || user.staff === true) {
      user.isAdmin = true;
  }

  if (!user.isAdmin) {
      return res.status(403).json({ code: 0, message: 'You do not have permission to send emails' });
  }

  try {
      const myRequest = await Request.findById(requestId);
      const myUser = await User.findOne({ id: myRequest.id });
      const templatePath = path.join(__dirname, 'send.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    const reviewMessageFormatted = formatForEmail(myRequest.reviewMessage);

      // Replace placeholders
      htmlTemplate = htmlTemplate.replace('{{username}}', myUser.displayName);
      htmlTemplate = htmlTemplate.replace('{{requestId}}', requestId);
      htmlTemplate = htmlTemplate.replace('{{requestIda}}', requestId);
      htmlTemplate = htmlTemplate.replace('{{reviewMessage}}', reviewMessageFormatted || "No review message was provided.");
      htmlTemplate = htmlTemplate.replace('{{status}}', myRequest.status);
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
