const express = require('express');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const router = express.Router();
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EPASS,
  },
});

router.post('/email-signin', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: `Sorry, no account found with email '${email}'` });
    }

    if (user.authType !== 'email') {
    return res.status(400).json({ message: `This email is already linked with ${user.authType}...` });
    }

    if (user.status !== 'active') {
      return res.status(400).json({
        message: "This email exists but is not verified. Complete the sign-up process first.",
      });
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the code and expiration
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.authType = 'email';
    await user.save();

    const templatePath = path.join(__dirname, 'e-signin.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

     const myUser = await User.findOne({ email });

    htmlTemplate = htmlTemplate.replace('{{username}}', myUser.displayName);
    htmlTemplate = htmlTemplate.replace('{{ip}}', userIp);
    htmlTemplate = htmlTemplate.replace('{{Vcode}}', verificationCode);

    // Send verification code to email

      await transporter.sendMail({
          from: `"Verification | NotReal003" <${process.env.EMAIL}>`,
          to: myUser.email,
          subject: `Your sign-in verification code`,
          html: htmlTemplate
      });

      return res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('Error in email-signin route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/verify-signin-email-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the verification code matches and is still valid
    if (user.verificationCode !== code || Date.now() > user.verificationCodeExpires) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Generate a JWT token
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET );

    // Clear the verification code and expiration
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Set token in a cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 604800000, // 7 days in milliseconds
    });

    return res.status(200).json({ message: 'Successfully logged in with email.', jwtToken });
  } catch (error) {
    console.error('Error in verify-signin-email-code route:', error);
    next(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
