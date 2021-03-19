'use strict';

require('dotenv').config();

const { App } = require('@slack/bolt');
const logger = require('heroku-logger');

const { reply } = require('./lib/slack');
const { bolt, port } = require('./config/server');

require('./lib/northstar').getClient();

const app = new App(bolt);

// Our Slack app is configured to listen for events that are direct messages to our bot.
app.message('', reply);

(async () => {
  await app.start(port);

  logger.info(`⚡️ DS Bot is running on port ${port} ⚡️`);
})();
