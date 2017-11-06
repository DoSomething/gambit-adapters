'use strict';

const Slack = require('@slack/client');
const logger = require('heroku-logger');

const gambitCampaigns = require('../../lib/gambit/campaigns');
const gambitConversations = require('../../lib/gambit/conversations');
const slack = require('../../lib/slack');

const RtmClient = Slack.RtmClient;
const WebClient = Slack.WebClient;
const RTM_EVENTS = Slack.RTM_EVENTS;
const CLIENT_EVENTS = Slack.CLIENT_EVENTS;

const apiToken = process.env.SLACK_API_TOKEN;
const rtm = new RtmClient(apiToken);
const web = new WebClient(apiToken);
let bot;
let team;

rtm.start();

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (response) => {
  bot = response.self.name;
  team = response.team.name;
  logger.info('Slothbot Slack authenticated.', { bot, team });
});

/**
 * Posts Campaign List Message to given Slack channel for given environmentName.
 * @param {object} channel
 * @param {string} environmentName
 * @return {Promise}
 */
function postCampaignIndexMessage(channel, environmentName) {
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
    .then(() => logger.debug('postCampaignIndexMessage', { channel, environmentName }))
    .catch((err) => {
      const message = err.message;
      rtm.sendMessage(message, channel);
      logger.error('postCampaignIndexMessage', err);
    });
}

/**
 * @param {string} channelId
 * @param {string} userId - Slack ID
 */
module.exports.postExternalSignupMenuMessage = function (channelId, userId, campaignId) {
  const data = {
    slackChannel: channelId,
    slackId: userId,
    campaignId,
    template: 'externalSignupMenu',
  };

  return gambitConversations.postOutboundMessage(data)
    .then(res => logger.debug('gambitConversations.postOutboundMessage', res.body))
    .catch(err => rtm.sendMessage(err.message, channelId));
};

/**
 * Posts given messageText to given Slack channel.
 * @param {string} channel
 * @param {string} messageText
 */
function postMessage(channel, messageText, args) {
  web.chat.postMessage(channel, messageText, args);
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

  logger.debug('slack message received', message);
  const channel = message.channel;
  let command;
  if (message.text) {
    command = message.text.toLowerCase().trim();
  }

  if (command === 'keywords') {
    return postCampaignIndexMessage(channel, 'production');
  }

  if (command === 'thor' || command === 'staging') {
    return postCampaignIndexMessage(channel, 'thor');
  }

  let mediaUrl = null;
  // Hack to upload images (when an image is shared over DM, it's private in Slack).
  if (command === 'photo') {
    // TODO: Allow pasting image URL.
    mediaUrl = 'http://cdn1us.denofgeek.com/sites/denofgeekus/files/dirt-dave-and-gill.jpg';
  }

  const data = {
    slackId: message.user,
    slackChannel: message.channel,
    messageId: message.ts,
    text: message.text,
    mediaUrl,
  };

  return gambitConversations.postInboundMessage(data)
    .then(res => logger.debug('gambitConversations.postInboundMessage', res.body))
    .catch(err => rtm.sendMessage(err.message, channel));
});
