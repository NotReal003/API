const express = require('express');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const axios = require('axios');
const router = express.Router();

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
    res.status(200).json({ message: 'Succesfully logged in with Discord.' });
  } catch (error) {
    console.error('Error during callback processing:', error.message);
    res.status(406).json({ message: 'We are sorry, there was a problem while processing. You can close this window and try again! ErrorType: SignIn' });
  }
});

module.exports = router;