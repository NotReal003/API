const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/github/callback', async (req, res) => {
  const GITHUB_ENDPOINT = 'https://github.com/login/oauth/access_token';
  const CLIENT_ID = process.env.G_ID;
  const CLIENT_SECRET = process.env.G_SECRET;
  const REDIRECT_URI = 'https://request.notreal003.org/github/callback';

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
    return res.status(406).json({ message: 'We are sorry, there was a problem while processing. You can close this window and try again! ErrorType: Github SignIn' });
  }
});

module.exports = router