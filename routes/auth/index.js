const express = require('express');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const axios = require('axios');
const router = express.Router();
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Blacklist = require('../../models/Blacklist');

// GET: api.notreal003.xyz/auth/signin
// GET: api.notreal003.xyz/auth/callback

const DASHBOARD_URL = 'https://request.notreal003.xyz';
// Example transporter setup for Nodemailer (customize as needed)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EPASS,
  },
});

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.get('/github', (req, res) => {
  const clientId = process.env.G_ID;
  const backUrl = 'https://request.notreal003.xyz';
  const redirectUri = 'https://request.notreal003.xyz/github/callback';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;

  res.redirect(backUrl);
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

  if (dupeUsername) {
    return res.status(400).json({ message: `This username '${username}' is already taken, please choose another one.` })
  }

  // a 6-digit verification code
  const verificationCode = generateVerificationCode();

  // Set expiration time for verification code (e.g., 10 minutes)
  const verificationCodeExpires = Date.now() + 1 * 60 * 1000; // 10 min

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
    text: `Hello ${username},\n\nYour verification code is: ${verificationCode}\n\nPlease use this code to verify your email within the next 2 minutes.`,
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
    .cookie('token', token, {
      domain: 'request.notreal003.xyz',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 604800000,
      // sameSite: 'Strict' // Ensuring sameSite is set for security
    })
  res.status(200).json({ message: 'Email verified successfully', jwtToken });
});

router.post('/email-signin', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Check if user exists
  let user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: `Sorry, We couldn't find any account with this email '${email}'` });
  }

  if (user.status !== 'active') {
    return res.status(400).json({ message: "This email was found but it's not verified yet, Please complete the Sign Up process first and try again later." });
  }

  // Generate a 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the code and expiration (e.g., 10 minutes)
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes
  user.authType = 'email';
  await user.save();

  // Send verification code to email
  const mailOptions = {
    from: `"Verification | NotReal003" <${process.env.EMAIL}>`,
    to: email,
    subject: 'Your sign-in verification code',
    text: `Your verification code is ${verificationCode}. This code will expire in 10 minutes.\n\n Request from IP address: ${userIp}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error('Error sending verification code:', error);
      return res.status(500).json({ message: 'Error sending verification code' });
    }

    res.status(200).json({ message: 'Verification code sent to your email.' });
  });
});

router.post('/verify-signin-email-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  // Find user by email
  let user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'not found' });
  }

  // Check if the verification code matches and is still valid
  if (user.verificationCode !== code || Date.now() > user.verificationCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  // Generate a JWT token
  const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // Clear the verification code and expiration
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  res
  .cookie('token', jwtToken, {
    domain: 'request.notreal003.xyz',
    httpOnly: true,
    // expires: new Date(Date.now() + 6.048e8),
    secure: process.env.NODE_ENV === 'production',
    maxAge: 604800000,
    // sameSite: ''
  })
  res.status(200).json({ jwtToken });
});

router.get('/signin', (req, res) => {
  res.redirect(
    `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&scope=identify+email`
  );
});

router.get('/callback', async (req, res) => {
  const DISCORD_ENDPOINT = 'https://discord.com/api/v10';
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      message: `We're sorry, there was a problem while processing. You can close this window and try again!`,
    });
  }
  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Exchange code for OAuth token
    const oauthRes = await axios.post(`${DISCORD_ENDPOINT}/oauth2/token`, new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
      code,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!oauthRes.data.access_token) {
      return res.status(500).json({ message: "We're sorry, there was a problem while processing. You can close this window and try again! ErrorType: oAuth" });
    }

    // Fetch user information from Discord
    const userRes = await axios.get(`${DISCORD_ENDPOINT}/users/@me`, {
      headers: {
        'Authorization': `Bearer ${oauthRes.data.access_token}`,
      },
    });

    if (!userRes.data.id) {
      return res.status(500).json({ message: "We're sorry, there was a problem while processing. You can close this window and try again! ErrorType: No UserId" });
    }
    const userResJson = userRes.data;

    if (!userResJson.email) {
      return res.status(500).json({ message: 'We are sorry, You have not connected any email with your Discord Account therefor we cannot accept this request. ErrorType: No Email.' });
    }

    try {
      let user = await User.findOne({ id: userResJson.id });

      if (!user) {
        console.log('Creating new user:', userResJson.id, userResJson.username);
        user = new User({
          id: userResJson.id,
          email: userResJson.email,
          username: userResJson.username,
          avatarHash: userResJson.avatar,
          accessToken: oauthRes.data.access_token,
          refreshToken: oauthRes.data.refresh_token,
          displayName: userResJson.global_name,
          staff: false,
          admin: false,
          authType: 'discord',
          ip: userIp,
          device: userAgent,
        });
      } else {
        console.log('Updating existing user:', userResJson.id, userResJson.username);
        user.email = userResJson.email;
        user.avatarHash = userResJson.avatar;
        user.accessToken = oauthRes.data.access_token;
        user.refreshToken = oauthRes.data.refresh_token;
        user.displayName = userResJson.global_name;
        user.authType = 'discord';
      }

      await user.save();
    } catch (error) {
      return res.status(500).json({ message: 'We are sorry, there was a problem while processing. You can close this window and try again! ErrorType: Database' });
    }
    if (!userResJson.id) {
      return res.status(500).json({ message: 'We are sorry, there was a problem while processing. You can close this window and try again! ErrorType: No User.' });
    }

    const token = jwt.sign(
      {
       id: userResJson.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res
    .cookie('token', token, {
      httpOnly: true,
      // expires: new Date(Date.now() + 6.048e8),
      secure: process.env.NODE_ENV === 'production',
      maxAge: 604800000,
      // sameSite: ''
    })
    res.status(200).json({ jwtToken: token });
  } catch (error) {
    console.error('Error during callback processing:', error.message);
    res.status(406).json({ message: 'We are sorry, there was a problem while processing. You can close this window and try again! ErrorType: SignIn' });
  }
});

router.get('/github/callback', async (req, res) => {
  const GITHUB_ENDPOINT = 'https://github.com/login/oauth/access_token';
  const CLIENT_ID = process.env.G_ID;
  const CLIENT_SECRET = process.env.G_SECRET;
  const REDIRECT_URI = 'https://request.notreal003.xyz/github/callback';

  res.status(406).json({ message: 'Due to security reasons, we are unable to accept Github OAuth, please SignIn with Discord or Email instead.' });

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      message: `We're sorry, there was a problem while processing. You can close this window and try again! ErrorType: Empty Code`,
    });
  }

  try {
    // Exchange code for OAuth token
    const oauthRes = await axios.post(`${GITHUB_ENDPOINT}`, new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }), {
      headers: { 'Accept': 'application/json' },
    });

    if (!oauthRes.data.access_token) {
      return res.status(500).json({ message: "We're sorry, there was a problem while processing. You can close this window and try again! ErrorType: Github oAuth" });
    }

    const accessToken = oauthRes.data.access_token;

    // Fetch user information from GitHub
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!userRes.data.id) {
      return res.status(500).json({ message: "We're sorry, there was a problem while processing. You can close this window and try again! ErrorType: Github user" });
    }

    const userResJson = userRes.data;

    // Fetch user emails (GitHub provides email in a separate endpoint)
    const emailRes = await axios.get('https://api.github.com/user/emails', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const emails = emailRes.data;
    const primaryEmail = emails.find(emailObj => emailObj.primary && emailObj.verified)?.email || null;

    if (!primaryEmail) {
      return res.status(500).json({ message: "We're sorry, there was a problem while processing. You can close this window and try again! ErrorType: No Email" });
    }

    try {
      let user = await User.findOne({ id: userResJson.id });

      if (!user) {
        console.log('Creating new GitHub user:', userResJson.id, userResJson.login);
        user = new User({
          id: userResJson.id,
          email: primaryEmail,  // use the email fetched from GitHub
          username: userResJson.login,
          avatarHash: userResJson.avatar_url,
          accessToken: accessToken,
          refreshToken: oauthRes.data.refresh_token || '',
          displayName: userResJson.name,
          authType: 'github',
        });
      } else {
        console.log('Updating existing GitHub user:', userResJson.id, userResJson.login);
        user.username = userResJson.login;
        user.email = primaryEmail;  // update the email if needed
        user.avatarHash = userResJson.avatar_url;
        user.accessToken = accessToken;
        user.refreshToken = oauthRes.data.refresh_token;
        user.displayName = userResJson.name;
        user.authType = 'github';
      }

      await user.save();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'We are sorry, there was a problem while processing. You can close this window and try again! ErrorType: Database' });
    }
    if (!userResJson.id) {
      return res.status(500).json({ message: 'We are sorry, there was a problem while processing. You can close this window and try again! ErrorType: No User.' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
       id: userResJson.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(200).json({ jwtToken: token, message: 'Successfully logged in with Github!' });
  } catch (error) {
    console.error('Error during callback processing:', error);
    res.status(406).json({ message: 'We are sorry, there was a problem while processing. You can close this window and try again! ErrorType: Github SignIn' });
  }
});

router.get('/signout', (req, res) => {
  res
    .cookie('token', '', {
      httpOnly: true,
      // expires: new Date(Date.now() + 6.048e8),
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      // sameSite: ''
    })
});

router.get('/signout/lets/see', async (req, res) => {
  const token = req.cookies.token;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        return res
          .status(201).json({ message: 'You are logged out..' })
          .clearCookie('token');
      }

      const request = new Blacklist({
        blacklistToken: token,
      });

      await request.save();

      return res
        .status(200).json({ message: 'Successfully logged out!' })
        .clearCookie('token');
    });
  } else {
    return res
      .status(204).json({ message: 'You are not logged in.' })
      .clearCookie('token');
  }
});

module.exports = router;
