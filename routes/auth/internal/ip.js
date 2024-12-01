const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // Ensure jwt is imported
const router = express.Router();
const User = require('../../../models/User');

// Discord webhook URL
const discordWebhookUrl = process.env.USER_AUTH_WEBTOKEN;

router.get('/', async (req, res) => {
    try {
        // Get the JWT token from the query parameters
        const token = req.query.callback;

        if (!token) {
            return res.status(400).send("We're sorry, there was a problem while processing. You can close this window and try again!");
        }

        // Get the user's IP address
        const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Get the timestamp
        const timestamp = new Date().toISOString();

        // Get the user-agent
        const userAgent = req.headers['user-agent'];

        // Initialize user details
        let discordId = 'N/A';
        let username = 'N/A';

        // Verify the token and fetch user details
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                return res.status(403).json({ message: 'A: Forbidden' });
            }

            // Fetch user details from the database
            const userResponse = await User.findOne({ id: decodedToken.id });
            if (userResponse) {
                discordId = userResponse.id;
                username = userResponse.username;
            }

            // Construct the embed object
            const embed = {
                title: "User Authentication Details",
                description: "User details during authentication",
                color: 7506394, // Color of the embed in decimal (hex #7277f3)
                fields: [
                    { name: "User Username", value: username, inline: true },
                    { name: "IP Address", value: userIp, inline: true },
                    { name: "User Discord ID", value: discordId, inline: true },
                    { name: "Timestamp", value: timestamp, inline: true },
                    { name: "User-Agent", value: userAgent, inline: true },
                ],
                footer: { text: "Security Event" }
            };

            // Send the embed to the Discord webhook
            try {
                await axios.post(discordWebhookUrl, {
                    embeds: [embed]
                });
            } catch (error) {
                console.error('Error sending data to Discord webhook:', error.message);
                return res.status(500).send("We're sorry, there was a problem while processing. You can close this window and try again!");
            }

            // If everything was successful, send a success message
            res.status(200).send("Authentication successful! You can close this window.");
        });
    } catch (error) {
        console.error('Unexpected error:', error.message);
        res.status(500).send("We're sorry, there was a problem while processing. You can close this window and try again!");
    }
});

module.exports = router;
