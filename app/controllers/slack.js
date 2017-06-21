'use strict';

const Slack = require('@slack/client');
const logger = require('winston');
const gambitCampaigns = require('../../lib/gambit-campaigns');
const gambitConversations = require('../../lib/gambit-conversations');
const slack = require('../../lib/slack');

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
module.exports.sendCampaignIndexMessage = function (channel, environmentName) {
  rtm.sendTyping(channel);

  return gambitCampaigns.index(environmentName)
    .then((response) => {
      const text = `Gambit ${environmentName.toUpperCase()} campaigns:`;
      const attachments = response.body.data.map((campaign, index) => {
        const attachment = slack.parseCampaignAsAttachment(environmentName, campaign, index);
        return attachment;
      });

      return web.chat.postMessage(channel, text, { attachments });
    })
    .then(() => logger.info(`campaignIndex channel=${channel} environment=${environmentName}`))
    .catch((err) => {
      const message = err.message;
      rtm.sendMessage(message, channel);
      logger.error(message);
    });
};

/**
 * Sends Campaign Detail Message to given Slack channel for given environmentName and campaignId.
 * @param {object} channel
 * @param {string} environmentName
 * @param {number} campaignId
 * @return {Promise}
 */
module.exports.sendCampaignDetailMessage = function (channel, environmentName, campaignId) {
  rtm.sendTyping(channel);

  return gambitCampaigns.get(environmentName, campaignId)
    .then((response) => {
      const campaign = response.body.data;
      const text = slack.getCampaignDetailText(environmentName, campaign);
      const messageTypes = Object.keys(campaign.messages);
      const attachments = messageTypes.map((messageType, index) => {
        const messageData = campaign.messages[messageType];

        return slack.parseCampaignMessageAsAttachment(messageType, messageData, index);
      });

      return web.chat.postMessage(channel, text, { attachments });
    })
    .then(() => logger.info(`campaignGet channel=${channel} environment=${environmentName}`))
    .catch((err) => {
      const message = err.message;
      rtm.sendMessage(message, channel);
      logger.error(message);
    });
};

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
    return exports.sendCampaignIndexMessage(channel, 'production');
  }

  if (message.text === 'thor') {
    return exports.sendCampaignIndexMessage(channel, 'thor');
  }

  const userId = `slack_${message.user}`;

  return gambitConversations.postUserMessage(userId, message.text)
    .then(reply => rtm.sendMessage(reply, channel))
    .catch(err => rtm.sendMessage(err.message, channel));
});
