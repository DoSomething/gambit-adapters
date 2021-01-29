'use strict';

const logger = require('heroku-logger');

const cache = require('./cache');
const gambit = require('./gambit');
const northstar = require('./northstar');

/**
 * @param {String} slackUserId
 * @param {WebClient} client
 * @return {String}
 */
async function getNorthstarIdBySlackUserId(slackUserId, client) {
  const northstarId = await cache.get(slackUserId);

  if (northstarId) {
    logger.debug('cache hit', { northstarId, slackUserId });

    return northstarId;
  }

  logger.debug('cache miss', { slackUserId });

  const slackApiResponse = await client.users.info({ user: slackUserId });

  logger.debug('client.users.info', { slackApiResponse });

  const northstarUser = await northstar
    .fetchUserByEmail(slackApiResponse.user.profile.email);

  return cache.set(slackUserId, northstarUser.id);
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

  return {
    text: message.text,
    attachments,
  };
}

/**
 * @param {WebClient} client
 * @param {String} channel
 * @param {String} text
 * @param {Array} attachments
 * @return {Promise}
 */
async function sendMessage(client, channel, text, attachments) {
  return await client.chat.postMessage({
    channel,
    text,
    attachments,
  });
}

/**
 * Sends message to channel where an error that has occurred.
 * @param {String} channel
 * @param {Error} error
 * @return {Promise}
 */
async function sendErrorMessage(client, channel, error) {
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

  return await sendMessage(client, channel, `Whoops, an error${statusText} occurred:`, attachments);
}

/**
 * Sends back the Gambit reply to a direct Slack message (or sends a broadcast).
 *
 * @param {Object} message
 * @param {WebClient} client
 */ 
async function reply({ message, client }) {
  const { channel } = message;

  try {
    const { command, arg } = parseInboundMessageCommand(message);

    const userId = await getUserIdBySlackUserId(message.user, client);

    if (command === 'broadcast') {
      if (!arg) {
        const errorMsg = 'Missing broadcast id. Example:\n\n> broadcast 2en018uiWcsMcIAWsGCQwS';

        return await sendMessage(client, channel, errorMsg);
      }

      const gambitResponse = await gambit.postBroadcastMessage(userId, arg);

      const { text, attachments } = parseOutboundMessage(gambitResponse);

      return await sendMessage(client, channel, text, attachments);
    }

    const gambitResponse = await gambit.postMemberMessage(
      userId,
      message.text,
      command === 'photo' ? arg : null,
    );
    
    logger.debug('gambitResponse', { result: gambitResponse.body });

    const reply = parseOutboundMessage(gambitResponse);

    if (!reply) {
      return await sendMessage(client, channel, 'Conversation is paused in `support` topic.');
    }

    return await sendMessage(client, channel, reply.text);
  } catch (error) {
    return await sendErrorMessage(client, channel, error);
  }
};

/**
 * @param {Object} message
 * @return {Object}
 */
function parseInboundMessageCommand(message) { 
  const { text } = message;

  if (text.toLowerCase().trim() === 'photo') {
    return {
      command: 'photo',
      // TODO: Inspect message for attachments instead of hardcoding an image URL.
      arg: process.env.MEDIA_URL || 'https://user-images.githubusercontent.com/1236811/104386167-6d222700-54e9-11eb-90f1-f7402020e821.JPG',
    };
  }

  const params = text.split(' ');

  if (params[0].toLowerCase() === 'broadcast') {
    return {
      command: 'broadcast',
      arg: params[1],
    };
  }

  return {};
}

module.exports = {
  reply,
};
