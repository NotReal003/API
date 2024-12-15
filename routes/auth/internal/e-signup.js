const express = require('express');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();
const nodemailer = require('nodemailer');

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EPASS,
  },
});

router.post('/email-signup', async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ message: 'Email and username are required' });
  }

  if (username.length < 3 || username.length > 16) {
    return res.status(400).json({ message: 'Username name must be between 3 and 16 characters.' });
  }

  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email given.' })
  }

  // Check if user already exists
  let user = await User.findOne({ email });
  const dupeUsername = await User.findOne({ username });
  if (user) {
    if (user.status === 'active') {
      return res.status(400).json({ message: 'This email is already registered, please SignIn :)' });
    }
  }

  if (user.authType !== 'email') {
    return res.status(400).json({ message: `This email is already linked with ${user.authType}...` });
  }

  if (dupeUsername) {
    return res.status(400).json({ message: `This username '${username}' is already taken, please choose another one.` })
  }

  // a 6-digit verification code
  const verificationCode = generateVerificationCode();

  // Set expiration time for verification code (e.g., 10 minutes)
  const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 min

  // Save user to database with a pending status (wait for verification)
  if (!user) {
    console.log('Creating new user');
    user = new User({
      id: uuidv4(),
      email,
      username,
      authType: 'email',
      staff: false,
      admin: false,
      verificationCode,
      verificationCodeExpires,
      status: 'pending',
      ip: userIp,
      device: userAgent,
    });
  } else {
    console.log('Updating user with new verification code');
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    user.authType = 'email';
  }

  await user.save();

  // Send email with the 6-digit verification code
  const mailOptions = {
    from: `"Verification | NotReal003" <${process.env.EMAIL}>`,
    to: email,
    subject: 'Verification Info',
    text: `Hello ${username},\n\nYour verification code is: ${verificationCode}\n\nPlease use this code to verify your email within the next 10 minutes.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending verification email:', error);
      return res.status(500).json({ message: 'Error while sending verification email' });
    }

    res.status(200).json({ message: `A verification code has been sent to your ${email}. Please check your inbox.` });
  });
});

// Generate a random 6-digit verification code
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: `Sorry, We couldn't find any account with this email ‘’${email}` });
  }

  // Check if the verification code matches and hasn't expired
  if (user.verificationCode !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  if (Date.now() > user.verificationCodeExpires) {
    return res.status(400).json({ message: 'The verification code has expired' });
  }
  const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // If valid, update user status to active
  user.status = 'active';
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.authType = 'email';

  await user.save();

  res
    .cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 604800000,
      // sameSite: 'Strict' // Ensuring sameSite is set for security
    })
  res.status(200).json({ message: 'Email verified successfully', jwtToken });
});

module.exports = router;
