'use strict';

const logger = require('heroku-logger');

const gambit = require('./gambit');
const { fetchUserByEmail } = require('./northstar');
const { parseInboundCommand } = require('./message');


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
  return client.chat.postMessage({
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

  return sendMessage({
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
    const { command, arg } = parseInboundCommand(message);
    const slackRes = await client.users.info({ user: message.user });
    const user = await fetchUserByEmail(slackRes.user.profile.email);

    if (command === 'broadcast') {
      if (!arg) {
        return await sendMessage({
          client,
          channel,
          text: 'Missing broadcast id. Example:\n\n> broadcast 2en018uiWcsMcIAWsGCQwS',
        });
      }

      const gambitRes = await gambit.postBroadcastMessage(user, arg);

      const { text, attachments } = parseOutboundMessage(gambitRes);

      return await sendMessage({ client, channel, text, attachments });
    }

    const gambitRes = await gambit.postMemberMessage(
      user.id,
      message.text,
      command === 'photo' ? arg : null,
    );

    const gambitReply = parseOutboundMessage(gambitRes);

    return await sendMessage({
      client,
      channel,
      text: gambitReply ? gambitReply.text : 'Conversation is paused in `support` topic.',
    });
  } catch (error) {
    return sendErrorMessage({ client, channel, error });
  }
}

module.exports = {
  reply,
};
