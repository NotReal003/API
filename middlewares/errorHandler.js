const axios = require('axios');

const webhookUrl = process.env.ERROR_WEBHOOK;

const errorHandler = async (err, req, res, next) => {
  console.error(err);
  try {
    await axios.post(webhookUrl, {
      embeds: [
        {
          title: 'API Error Notification',
          description: `An error occurred in the API.`,
          color: 16711680, // Red color
          fields: [
            {
              name: 'Error Message',
              value: `\`\`\`${err.message}\`\`\``
            },
            {
              name: 'Route',
              value: req.originalUrl || 'Unknown Route'
            },
            {
              name: 'Method',
              value: req.method
            },
            {
              name: 'Timestamp',
              value: new Date().toISOString()
            }
          ]
        }
      ]
    });
  } catch (webhookError) {
    console.error('Failed to send error details to Discord:', webhookError.message);
  }

  res.status(err.status || 500).json({
    success: false,
    message: 'An internal server error occurred.',
  });
};

module.exports = errorHandler;
