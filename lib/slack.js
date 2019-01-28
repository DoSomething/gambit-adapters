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
 * @param {String} slackUserId
 * @return {Promise}
 */
async function getUserIdBySlackUserId(slackUserId) {
  const userId = await helpers.cache.get(slackUserId);
  if (userId) {
    logger.debug('cache hit', { userId, slackUserId });
    return userId;
  }

  logger.debug('cache miss', { slackUserId });
  const slackRes = await web.users.info(slackUserId);
  const user = await northstar.fetchUserByEmail(slackRes.user.profile.email);

  return helpers.cache.set(slackUserId, user.id);
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
function parseOutboundMessage(res) {
  const isReply = res.body.data.messages.outbound;
  const message = isReply ? res.body.data.messages.outbound[0] : res.body.data.messages[0];
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
 * @param {String} channel
 * @param {Object} gambitRes
 */
function sendGambitResponse(channel, gambitRes) {
  const outboundMessage = parseOutboundMessage(gambitRes);
  if (!outboundMessage.text) {
    return Promise.resolve();
  }
  return sendMessage(channel, outboundMessage.text, outboundMessage.attachments);
}

/**
 * @param {String} channel
 * @param {String} slackUserId
 * @param {Number} campaignId
 * @return {Promise}
 */
async function sendSignup(channel, slackUserId, campaignId) {
  logger.debug('sendSignup', { channel, slackUserId, campaignId });
  const userId = await getUserIdBySlackUserId(slackUserId);
  const gambitRes = await gambit.postSignupMessage(userId, campaignId);
  return sendGambitResponse(channel, gambitRes);
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
      return sendMessage(channel, 'Temporarily unsupported.');
    }

    const userId = await getUserIdBySlackUserId(message.user);

    if (command === 'broadcast') {
      const broadcastId = message.broadcastId;
      if (!broadcastId) {
        const errorMsg = 'Missing broadcast id. Example:\n\n> broadcast 2en018uiWcsMcIAWsGCQwS';
        return sendMessage(channel, errorMsg);
      }
      const gambitRes = await gambit.postBroadcastMessage(userId, broadcastId);
      return sendGambitResponse(channel, gambitRes);
    }

    if (command === 'signup') {
      const campaignId = message.campaignId;
      if (!campaignId) {
        const errorMsg = 'Missing signup campaign id. Example:\n\n> signup 5646';
        return sendMessage(channel, errorMsg);
      }
      const gambitRes = await gambit.postSignupMessage(userId, campaignId);
      return sendGambitResponse(channel, gambitRes);
    }

    const gambitRes = await gambit.postMemberMessage(userId, message.text, message.mediaUrl);
    return sendGambitResponse(channel, gambitRes);
  } catch (error) {
    return sendErrorMessage(message.channel, error);
  }
});

module.exports = {
  isValidToken,
  sendSignup,
};
