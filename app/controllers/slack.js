'use strict';

const Slack = require('@slack/client');
const logger = require('heroku-logger');

const gambitCampaigns = require('../../lib/gambit/campaigns');
const gambitChatbot = require('../../lib/gambit/chatbot');
const slack = require('../../lib/slack');
const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).slack;

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
  logger.info('Slothbot Slack authenticated.');

  dashbot.logConnect(response);
  bot = response.self;
  team = response.team;
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
 * Posts Campaign Detail Message to given Slack channel for given environmentName and campaignId.
 * @param {object} channel
 * @param {string} environmentName
 * @param {number} campaignId
 * @return {Promise}
 */
module.exports.postCampaignDetailMessage = function (channel, environmentName, campaignId) {
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
    .then(() => logger.debug(`campaignGet channel=${channel} environment=${environmentName}`))
    .catch((err) => {
      const message = err.message;
      rtm.sendMessage(message, channel);
      logger.error(message);
    });
};

/**
 * Posts given messageText to given Slack channel.
 * @param {string} channel
 * @param {string} messageText
 */
function postMessage(channel, messageText) {
  web.chat.postMessage(channel, messageText);
}

/**
 * Posts Slack message for a given Slothie Action.
 */
module.exports.postMessageForAction = function (action) {
  if (action.type !== 'updateUserPaused') {
    return;
  }

  const messageText = slack.parseUpdateUserPausedActionAsText(action);
  postMessage(process.env.SLACK_ALERT_CHANNEL, messageText);
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

  logger.debug('slack message received', message);
  const channel = message.channel;
  const keyword = message.text.toLowerCase().trim();

  if (keyword === 'keywords') {
    return postCampaignIndexMessage(channel, 'production');
  }

  if (keyword === 'thor') {
    return postCampaignIndexMessage(channel, 'thor');
  }

  dashbot.logIncoming(bot, team, message);
  let mediaUrl = null;
  // Hack to upload images (when an image is shared over DM, it's private in Slack).
  if (keyword === 'photo') {
    // TODO: Allow pasting image URL.
    mediaUrl = 'http://cdn1us.denofgeek.com/sites/denofgeekus/files/dirt-dave-and-gill.jpg';
  }

  return gambitChatbot.getReply(message.user, message.text, mediaUrl, 'slack')
    .then((reply) => {
      // We can sometimes get the silent treatment (e.g. in the Crisis Inbox).
      if (!reply.text) return true;

      // @see https://www.dashbot.io/sdk/slack
      const dashbotPayload = {
        type: 'message',
        text: reply.text,
        channel,
      };
      dashbot.logOutgoing(bot, team, dashbotPayload);

      return rtm.sendMessage(reply.text, channel);
    })
    .catch(err => rtm.sendMessage(err.message, channel));
});
