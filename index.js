'use strict';

const Promise = require('bluebird');
const Botkit = require('botkit');
const helpers = require('./lib/helpers');

const controller = Botkit.slackbot();
const slothbot = controller.spawn({ token: process.env.SLACK_API_TOKEN });

slothbot.startRTM((err) => {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.hears('keywords', ['mention', 'direct_message'], (bot, message) => {
  helpers.fetchCampaigns('production')
    .then(response => bot.reply(message, response))
    .catch(err => bot.reply(message, err.message));
});

controller.hears('thor', ['mention', 'direct_message'], (bot, message) => {
  helpers.fetchCampaigns('thor')
    .then(response => bot.reply(message, response))
    .catch(err => bot.reply(message, err.message));
});
