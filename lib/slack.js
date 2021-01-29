'use strict';

const logger = require('heroku-logger');

const gambit = require('./gambit');
const helpers = require('./helpers');
const northstar = require('./northstar');

/**
 * @param {String} slackUserId
 * @param {WebClient} client
 * @return {Promise}
 */
async function getUserIdBySlackUserId(slackUserId, client) {
  const userId = await helpers.cache.get(slackUserId);

  if (userId) {
    logger.debug('cache hit', { userId, slackUserId });

    return userId;
  }

  logger.debug('cache miss', { slackUserId });

  const slackApiResponse = await client.users.info({ user: slackUserId });

  logger.debug('client.users.info', { slackApiResponse });

  const northstarUser = await northstar
    .fetchUserByEmail(slackApiResponse.user.profile.email);

  return helpers.cache.set(slackUserId, northstarUser.id);
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
function sendErrorMessage(client, channel, error) {
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

  return sendMessage(client, channel, `Whoops, an error${statusText} occurred:`, attachments);
}

/**
 * Sends Gambit reply to a direct message.
 */
async function reply(message, client) {
  const { channel } = message;

  try {
    const { command, arg } = helpers.message.parseMessageCommand(message);

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
      return await sendMessage(client, channel, 'Conversation is paused in support topic.');
    }

    return await sendMessage(client, channel, reply.text);
  } catch (error) {
    return await sendErrorMessage(client, channel, error);
  }
};

module.exports = {
  reply,
};

