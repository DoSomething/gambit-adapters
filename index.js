'use strict';

const Botkit = require('botkit');
const helpers = require('./lib/helpers');
const logger = require('winston');

const controller = Botkit.slackbot({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  interactive_replies: true,
  scopes: ['bot'],
});
const slothbot = controller.spawn({ token: process.env.SLACK_API_TOKEN });

slothbot.startRTM((err, bot, payload) => {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
  // Save team to get Interactive Messages working.
  // @see https://github.com/howdyai/botkit/issues/108.
  controller.saveTeam(payload.team, () => {
    logger.info(`Saved team id:${payload.team.id}`);
  });
});

controller.hears('keywords', ['direct_mention', 'direct_message'], (bot, message) => {
  bot.reply(message, 'Finding all Gambit campaigns running on production...');

  return helpers.fetchCampaigns('production')
    .then(response => slothbot.reply(message, response))
    .catch(err => slothbot.reply(message, err.message));
});

controller.hears('thor', ['direct_mention', 'direct_message'], (bot, message) => {
  bot.reply(message, 'Finding all Gambit campaigns running on Thor...');

  return helpers.fetchCampaigns('thor')
    .then(response => slothbot.reply(message, response))
    .catch(err => slothbot.reply(message, err.message));
});

controller.on('interactive_message_callback', (bot, message) => {
  logger.info(`Received interactive_message_callback:${message.callback_id}`);
  const data = message.callback_id.split('_');

  return helpers.fetchRenderedCampaignMessages(data[1], data[0])
    .then(response => slothbot.reply(message, response))
    .catch(err => slothbot.reply(message, err.message));
});

const port = process.env.PORT || 5000;
controller.setupWebserver(port, (err, server) => {
  controller.createWebhookEndpoints(server);
});
