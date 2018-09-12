'use strict';

const Slack = require('@slack/client');
const logger = require('heroku-logger');
const gambit = require('./gambit');
const northstar = require('./northstar');
const helpers = require('./helpers');
const config = require('../config/lib/slack');

const apiToken = config.clientOptions.apiToken;
const rtm = new Slack.RtmClient(apiToken);
const web = new Slack.WebClient(apiToken);

rtm.start();

rtm.on(Slack.CLIENT_EVENTS.RTM.AUTHENTICATED, (res) => {
  logger.info('Slack authenticated.', { bot: res.self.name });
});

/**
 * @param {String} token
 * @return {Promise}
 */
async function getUserIdBySlackUserId(slackUserId) {
  const userId = await helpers.cache.get(slackUserId);
  if (userId) {
    logger.debug('cache hit', { userId, slackUserId });
    return userId;
  }
  logger.debug('cache miss', { slackUserId });
  return web.users.info(slackUserId)
    .then(slackRes => northstar.fetchUserByEmail(slackRes.user.profile.email))
    .then(user => helpers.cache.set(slackUserId, user.id));
}

/**
 * @param {String} token
 * @return {Boolean}
 */
function isValidToken(token) {
  return token === config.clientOptions.verificationToken;
}

/**
 * @param {Object} res
 * @return {Object}
 */
function parseGambitResponse(res) {
  const message = res.body.data.messages[0];
  const attachments = message.attachments.map((attachment) => {
    const url = attachment.url;
    return {
      image_url: url,
      fallback: url,
    };
  });
  return { text: message.text, attachments };
}

/**
 * @param {String} channel
 * @param {String} text
 * @param {Array} attachments
 * @return {Promise}
 */
function sendMessage(channel, text, attachments) {
  return web.chat.postMessage(channel, text, { attachments });
}

/**
 * Sends message to channel where an error that has occurred.
 * @param {String} channel
 * @param {Error} error
 * @return {Promise}
 */
function sendErrorMessage(channel, error) {
  logger.error('sendErrorMessage', { error });
  const statusText = error.status ? ` with status *${error.status}*` : '';
  let errorMessageText = error.message;
  if (error.response && error.response.body) {
    errorMessageText = error.response.body.message;
  }
  const attachments = [{
    color: 'danger',
    text: errorMessageText || 'Internal server error',
  }];

  return sendMessage(channel, `Whoops, an error${statusText} occurred:`, attachments);
}

/**
 * Posts list of campaigns that send web signup confirmations.
 * @param {String} channel
 * @return {Promise}
 */
function sendWebSignupList(channel) {
  rtm.sendTyping(channel);
  // Note: we'll eventually query the webSignup list by finding all contentfulEntries with type
  // campaign and where a webSignup field exists.
  return gambit.get('campaigns')
    .then((gambitRes) => {
      const activeCampaigns = gambitRes.body.filter(campaign => campaign.status === 'active');
      const attachments = activeCampaigns.map((campaign, index) => ({
        callback_id: campaign.id,
        color: helpers.getHexForIndex(index),
        title: helpers.getCampaignTitleWithId(campaign),
        actions: [{
          name: 'action',
          text: 'Send test',
          type: 'button',
          value: 'webSignup',
        }],
      }));
      return sendMessage(channel, 'Current campaigns', attachments);
    });
}

/**
 * @param {string} channel
 * @param {string} slackUserId
 * @param {string} campaignId
 */
async function sendSignup(channel, slackUserId, campaignId) {
  const userId = await getUserIdBySlackUserId(slackUserId);
  const data = await parseGambitResponse(gambit.postSignupMessage(userId, campaignId));
  return sendMessage(channel, data.text, data.attachments);
}

/**
 * Handle message events.
 */
rtm.on(Slack.RTM_EVENTS.MESSAGE, async (message) => {
  try {
    if (!helpers.message.isDirectMessageFromUser(message)) {
      return null;
    }

    helpers.message.parseMessage(message);
    const channel = message.channel;
    const command = message.command;

    if (command === 'web') {
      return sendWebSignupList(channel);
    }

    const userId = await getUserIdBySlackUserId(message.user);

    if (command === 'broadcast') {
      if (!message.broadcastId) {
        const errorMsg = 'Missing broadcast id. Example:\n\n> broadcast 2en018uiWcsMcIAWsGCQwS';
        return sendMessage(channel, errorMsg);
      }
      return gambit.postBroadcastMessage(userId, message.broadcastId)
        .then((res) => {
          const data = parseGambitResponse(res);
          return sendMessage(channel, data.text, data.attachments);
        });
    }

    const gambitRes = await gambit.postMemberMessage(userId, message.text, message.mediaUrl);
    const reply = gambitRes.body.data.messages.outbound[0];
    if (!reply.text) {
      return true;
    }

    return sendMessage(channel, reply.text);
  } catch (error) {
    return sendErrorMessage(message.channel, error);
  }
});

module.exports = {
  isValidToken,
  sendSignup,
};
