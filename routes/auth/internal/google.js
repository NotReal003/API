const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
require('dotenv').config();
const passport = require('../../../config/passport');
        require('../../../config/passport'); 

const router = express.Router();

router.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/callback', async (req, res, next) => {
  const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = 'https://request.notreal003.xyz/google/callback';
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      message: `We're sorry, there was a problem while processing. You can close this window and try again!`,
    });
  }

  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(GOOGLE_TOKEN_URL, new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
      grant_type: 'authorization_code',
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!tokenRes.data.access_token) {
      return res.status(500).json({ message: "We're sorry, there was a problem while processing. ErrorType: OAuth" });
    }

    // Fetch user information from Google
    const userRes = await axios.get(GOOGLE_USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${tokenRes.data.access_token}`,
      },
    });

    if (!userRes.data.id) {
      return res.status(500).json({ message: "We're sorry, there was a problem while processing. ErrorType: No UserId" });
    }

    const userResJson = userRes.data;

    try {
      let user = await User.findOne({ id: userResJson.id });

      if (!user) {
        console.log('Creating new user:', userResJson.id, userResJson.name);

        let username = userResJson.name.replace(/\s+/g, '');
        let existingUser = await User.findOne({ username });
        let count = 1;

        while (existingUser) {
          username = `${userResJson.name}${count}`;
          existingUser = await User.findOne({ username });
          count++;
        }

        user = new User({
          id: userResJson.id,
          email: userResJson.email,
          username,
          avatarHash: userResJson.picture,
          accessToken: tokenRes.data.access_token,
          refreshToken: tokenRes.data.refresh_token,
          displayName: userResJson.name,
          staff: false,
          admin: false,
          authType: 'google',
          ip: userIp,
          device: userAgent,
        });
      } else {
        console.log('Updating existing user:', userResJson.id, userResJson.name);
        user.email = userResJson.email;
        user.avatarHash = userResJson.picture;
        user.accessToken = tokenRes.data.access_token;
        user.refreshToken = tokenRes.data.refresh_token;
        user.displayName = userResJson.name;
        user.authType = 'google';

        const otherUser = await User.findOne({ username: userResJson.name, googleId: { $ne: user.googleId } });
        if (otherUser) {
          let username = userResJson.name.replace(/\s+/g, '');
          let existingUser = await User.findOne({ username });
          let count = 1;

          while (existingUser) {
            username = `${userResJson.name}${count}`;
            existingUser = await User.findOne({ username });
            count++;
          }

          user.username = username;
        }
      }

      await user.save();
    } catch (error) {
      console.log(error);
      next(error);
      return res.status(500).json({ message: 'We are sorry, there was a problem while processing. ErrorType: Database' });
    }

    if (!userResJson.id) {
      return res.status(500).json({ message: 'We are sorry, there was a problem while processing. ErrorType: No User Found.' });
    }

    const token = jwt.sign({ id: userResJson.id }, process.env.JWT_SECRET);

    res.status(200).json({ message: 'Successfully logged in with Google.', jwtToken: token });

  } catch (error) {
    console.error('Error during callback processing:', error.message);
    next(error);
    res.status(406).json({ message: 'We are sorry, there was a problem while processing. ErrorType: SignIn' });
  }
});

module.exports = router;
