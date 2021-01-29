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

  const slackRes = await client.users.info({ user: slackUserId });

  const northstarRes = await northstar.fetchUserByEmail(slackRes.user.profile.email);

  return cache.set(slackUserId, northstarRes.id);
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
async function sendMessage({ client, channel, text, attachments }) {
  return await client.chat.postMessage({
    channel,
    text,
    attachments,
  });
}

/**
 * Sends message to channel where an error that has occurred.
 *
 * @param {WebClient} client
 * @param {String} channel
 * @param {Error} error
 * @return {Promise}
 */
async function sendErrorMessage({ client, channel, error }) {
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

  return await sendMessage({
    client,
    channel,
    text: `Whoops, an error${statusText} occurred:`,
    attachments,
  });
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

    const userId = await getNorthstarIdBySlackUserId(message.user, client);

    if (command === 'broadcast') {
      if (!arg) {
        return await sendMessage({
          client,
          channel,
          text: 'Missing broadcast id. Example:\n\n> broadcast 2en018uiWcsMcIAWsGCQwS',
        });
      }

      const gambitRes = await gambit.postBroadcastMessage(userId, arg);

      const { text, attachments } = parseOutboundMessage(gambitRes);

      return await sendMessage({ client, channel, text, attachments });
    }

    const gambitRes = await gambit.postMemberMessage(
      userId,
      message.text,
      command === 'photo' ? arg : null,
    );
    
    const reply = parseOutboundMessage(gambitRes);

    return await sendMessage({
      client,
      channel,
      text: reply ? reply.text : 'Conversation is paused in `support` topic.',
    });
  } catch (error) {
    return await sendErrorMessage({ client, channel, error });
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
