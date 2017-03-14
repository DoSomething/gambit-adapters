'use strict';

const Botkit = require('botkit');
const helpers = require('./lib/helpers');

const controller = Botkit.slackbot();
const slothbot = controller.spawn({ token: process.env.SLACK_API_TOKEN });

slothbot.startRTM((err) => {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.hears('keywords', ['direct_mention', 'direct_message'], (bot, message) => {
  bot.reply(message, 'Finding all Gambit campaigns running on production...');

  return helpers.fetchCampaigns('production')
    .then(response => bot.reply(message, response))
    .catch(err => bot.reply(message, err.message));
});

controller.hears('thor', ['direct_mention', 'direct_message'], (bot, message) => {
  bot.reply(message, 'Finding all Gambit campaigns running on Thor...');

  return helpers.fetchCampaigns('thor')
    .then(response => bot.reply(message, response))
    .catch(err => bot.reply(message, err.message));
});
