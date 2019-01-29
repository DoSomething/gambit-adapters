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
 * @param {Object} res
 * @return {Object}
 */
function parseOutboundMessage(res) {
  if (!res.body.data || !res.body.data.messages) {
    return null;
  }
  const message = res.body.data.messages.outbound
    ? res.body.data.messages.outbound[0]
    : res.body.data.messages[0];
  const attachments = message.attachments.map(attachment => ({
    image_url: attachment.url,
    fallback: attachment.url,
  }));
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
 * Handle message events.
 */
rtm.on(Slack.RTM_EVENTS.MESSAGE, async (message) => {
  try {
    if (!helpers.message.isDirectMessageFromUser(message)) {
      return null;
    }

    helpers.message.parseMessage(message);
    const channel = message.channel;

    const userId = await getUserIdBySlackUserId(message.user);

    if (message.command === 'broadcast') {
      if (!message.broadcastId) {
        const errorMsg = 'Missing broadcast id. Example:\n\n> broadcast 2en018uiWcsMcIAWsGCQwS';
        return sendMessage(channel, errorMsg);
      }

      const gambitRes = await gambit.postBroadcastMessage(userId, message.broadcastId);

      const broadcastMessage = parseOutboundMessage(gambitRes);

      return sendMessage(channel, broadcastMessage.text, broadcastMessage.attachments);
    }

    if (message.command === 'signup') {
      if (!message.campaignId) {
        const errorMsg = 'Missing signup campaign id. Example:\n\n> signup 5646';
        return sendMessage(channel, errorMsg);
      }

      const gambitRes = await gambit.postSignupMessage(userId, message.campaignId);

      const signupMessage = parseOutboundMessage(gambitRes);
      if (!signupMessage) {
        return sendMessage(channel, `Web signup confirmation not found for ${message.campaignId}.`);
      }

      return sendMessage(channel, signupMessage.text, signupMessage.attachments);
    }

    const gambitRes = await gambit.postMemberMessage(userId, message.text, message.mediaUrl);

    const replyMessage = parseOutboundMessage(gambitRes);
    if (!replyMessage) {
      return sendMessage(channel, 'Conversation is paused in support topic.');
    }

    return sendMessage(channel, replyMessage.text);
  } catch (error) {
    return sendErrorMessage(message.channel, error);
  }
});
