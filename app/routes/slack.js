'use strict';

const express = require('express');
const Slack = require('@slack/client');
const logger = require('winston');
const gambitCampaigns = require('../../lib/gambit-campaigns');
const slackHelper = require('../../lib/slack');

const router = express.Router();

const RtmClient = Slack.RtmClient;
const WebClient = Slack.WebClient;
const RTM_EVENTS = Slack.RTM_EVENTS;
const apiToken = process.env.SLACK_API_TOKEN;
const rtm = new RtmClient(apiToken);
const web = new WebClient(apiToken);

rtm.start();

/**
 * Sends Campaign List Message to given Slack channel for given environmentName.
 * @param {object} channel
 * @param {string} environmentName
 * @return {Promise}
 */
function sendCampaignIndexMessageToChannel(channel, environmentName) {
  rtm.sendTyping(channel);

  return gambitCampaigns.index(environmentName)
    .then((response) => {
      const attachments = response.body.data.map((campaign, index) => {
        return slackHelper.parseCampaignAsAttachment(environmentName, campaign, index);
      });

      return attachments;
    })
    .then((attachments) => {
      const text = `Gambit ${environmentName.toUpperCase()} campaigns:`;

      return web.chat.postMessage(channel, text, { attachments });
    })
    .then(() => logger.info(`campaignIndex channel=${channel} environment=${environmentName}`))
    .catch((err) => {
      const message = err.message;
      rtm.sendMessage(message, channel);
      logger.error(message);
    });
}

/**
 * Sends Campaign Detail Message to given Slack channel for given environmentName and campaignId.
 * @param {object} channel
 * @param {string} environmentName
 * @param {number} campaignId
 * @return {Promise}
 */
function sendCampaignDetailMessageToChannel(channel, environmentName, campaignId) {
  rtm.sendTyping(channel);

  return gambitCampaigns.get(environmentName, campaignId)
    .then((response) => {
      const campaign = response.body.data;
      const text = slackHelper.getCampaignDetailText(environmentName, campaign);

      return web.chat.postMessage(channel, text);
    })
    .then(() => logger.info(`campaignGet channel=${channel} environment=${environmentName}`))
    .catch((err) => {
      const message = err.message;
      rtm.sendMessage(message, channel);
      logger.error(message);
    });
}

/**
 * Handle message events.
 */
rtm.on(RTM_EVENTS.MESSAGE, (message) => {
  // Only respond to private messages.
  if (message.channel[0] !== 'D') return null;

  // Don't reply to our sent messages.
  if (message.reply_to || message.bot_id) {
    return null;
  }

  const channel = message.channel;

  if (message.text === 'keywords') {
    return sendCampaignIndexMessageToChannel(channel, 'production');
  }

  if (message.text === 'thor') {
    return sendCampaignIndexMessageToChannel(channel, 'thor');
  }

  return rtm.sendMessage("G'DAY MATE", channel);
});

/**
 * Accept interactive messages.
 * @see https://api.slack.com/tutorials/intro-to-message-buttons
 */
router.post('/', (req, res) => {
  const payload = JSON.parse(req.body.payload);

  if (payload.token !== process.env.SLACK_VERFICIATION_TOKEN) {
    return res.status(403).end('Access forbidden');
  }

  res.status(200).end();
  const channelId = payload.channel.id;
  const data = slackHelper.parseCallbackId(payload.callback_id);

  return sendCampaignDetailMessageToChannel(channelId, data.environmentName, data.campaignId);
});

module.exports = router;
