const express = require('express');
const router = express.Router();
const Blacklist = require('../../../models/Blacklist');
const jwt = require('jsonwebtoken');

router.get('/signin', (req, res) => {
  res.redirect(
    `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&scope=identify+email`
  );
});

router.get('/github', (req, res) => {
  const clientId = process.env.G_ID;
  const backUrl = 'https://request.notreal003.xyz';
  const redirectUri = 'https://request.notreal003.xyz/github/callback';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;

  res.redirect(backUrl);
});

router.get('/signout', async (req, res) => {
  const token = req.cookies.token;

  // Clear cookie regardless of token presence
  if (!token) {
    res.clearCookie('token', { httpOnly: true, secure: true });
    return res.status(400).json({ message: "You aren't verified, please refresh the page." });
  }

  try {
    // Verify the token
    const savedToken = await Blacklist.findOne({ blacklistToken: token });
    if (savedToken) {
      res.clearCookie('token', { httpOnly: true, secure: true });
      return res.status(200).json({ message: 'Successfully logged out. Active session found.' });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Add token to blacklist
    await Blacklist.create({ blacklistToken: token, user_id: decodedToken.id });

    res.clearCookie('token', { httpOnly: true, secure: true });
    return res.status(200).json({ message: 'Successfully logged out.' });
  } catch (err) {
    // Handle invalid token or verification errors
    if (err) {
      res.clearCookie('token', { httpOnly: true, secure: true });
      return res.status(406).json({ message: 'Invalid or expired session' });
    }

    return res.status(500).json({ message: 'Error during logout. Please try again later.' });
  }
});

//router.get('/signout', (req, res) => {
//  res.clearCookie('token', { httpOnly: true, secure: true });
//  return res.sendStatus(204);;
//});

module.exports = router;