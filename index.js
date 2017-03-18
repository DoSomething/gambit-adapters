'use strict';

const Botkit = require('botkit');
const contentful = require('contentful');
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
        const responseMessages = listener.fields.responseMessages.split('|');
        const replyMessage = responseMessages[Math.floor(Math.random() * responseMessages.length)];
        bot.reply(message, replyMessage);
      });
    });
  });


controller.hears('help', ['direct_mention', 'direct_message'], (bot, message) => {
  const helpMsg = 'Hey, it\'s me, Puppet Sloth. I\'ve been resurrected as a bot who knows what ' +
    'campaigns currently have SMS keywords.\n\nSend me a direct message that says *keywords* to ' +
    'see what keywords are live. You can also send a DM with *thor* to view our test keywords.';
  bot.reply(message, helpMsg);
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
