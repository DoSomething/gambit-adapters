require('dotenv').config();

const { App } = require('@slack/bolt');
const logger = require('heroku-logger');

const { reply } = require('./lib/slack');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Our Slack app is configured to listen for events that are DM messages to the bot. 
app.message('', async ({ message, client }) => {
  // Sends a message to the channel where the event was triggered.
  await reply(message, client);
});

(async () => {
  await app.start(process.env.PORT || 3000);

  logger.info('⚡️ DS Bot is running! ⚡️');
})();
