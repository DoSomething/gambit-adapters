'use strict';

const Botkit = require('botkit');
const contentful = require('contentful');
const logger = require('winston');
const helpers = require('./lib/helpers');

const controller = Botkit.slackbot({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  interactive_replies: true,
  scopes: ['bot'],
});

const slothbot = controller.spawn({ token: process.env.SLACK_API_TOKEN });

const dashbotApikey = process.env.DASHBOT_API_KEY;
if (dashbotApikey) {
  const dashbot = require('dashbot')(dashbotApikey).slack; // eslint-disable-line global-require

  controller.middleware.receive.use(dashbot.receive);
  controller.middleware.send.use(dashbot.send);
}

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

let client;
try {
  client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });
} catch (err) {
  logger.error(`contentful error:${err.message}`);
}

client.getEntries({ content_type: 'listener' })
  .then((response) => {
    response.items.forEach((listener) => {
      controller.hears(listener.fields.keywords, listener.fields.events, (bot, message) => {
        const json = listener.fields.replyMessageJson;
        if (json.messages && json.messages.length > 0) {
          const replyMessages = json.messages;
          const replyMessage = json.messages[Math.floor(Math.random() * replyMessages.length)];
          bot.reply(message, replyMessage);
        }
      });
    });
  });

controller.hears('keywords', ['direct_message'], (bot, message) => {
  bot.reply(message, 'Finding all Gambit Campaigns running on production...');

  return helpers.fetchCampaigns('production')
    .then(response => slothbot.reply(message, response))
    .catch(err => slothbot.reply(message, err.message));
});

controller.hears('thor', ['direct_message'], (bot, message) => {
  bot.reply(message, 'Finding all Gambit Campaigns running on Thor...');

  return helpers.fetchCampaigns('thor')
    .then(response => slothbot.reply(message, response))
    .catch(err => slothbot.reply(message, err.message));
});

controller.on('interactive_message_callback', (bot, message) => {
  logger.info(`Received interactive_message_callback:${message.callback_id}`);
  // Our callback_id is defined as environmentName_campaignId, e.g. 'thor_7483'.
  const data = message.callback_id.split('_');
  const campaignId = data[1];
  const environmentName = data[0];
  const findingMsg = `Finding all messages for Campaign ${campaignId} on ${environmentName}...`;
  slothbot.reply(message, findingMsg);

  return helpers.fetchRenderedCampaignMessages(campaignId, environmentName)
    .then(response => slothbot.reply(message, response))
    .catch(err => slothbot.reply(message, err.message));
});

const port = process.env.PORT || 5000;
controller.setupWebserver(port, (err, server) => {
  controller.createWebhookEndpoints(server);
});
