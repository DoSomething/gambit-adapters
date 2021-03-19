'use strict';

const logger = require('heroku-logger');
  
const { fetchUserByEmail } = require('./northstar');
const { parseInboundCommand } = require('./message');
const { postBroadcastMessage, postMemberMessage } = require('./gambit');

/**
 * @param {WebClient} client
 * @param {String} channel
 * @param {String} text
 * @param {Array} attachments
 * @return {Promise}
 */
async function sendSlackMessage({ client, channel, text, attachments }) {
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
async function sendSlackMessageWithError({ client, channel, error }) {
  logger.error('sendSlackMessageWithError', { error });

  const statusText = error.status ? ` with status *${error.status}*` : '';
  let errorMessageText = error.message;

  if (error.response && error.response.body) {
    errorMessageText = error.response.body.message;
  }

  const attachments = [{
    color: 'danger',
    text: errorMessageText || 'Internal server error',
  }];

  return sendSlackMessage({
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
    // Fetch Slack profile information of the message sender.
    const slackApiResponse = await client.users.info({ user: message.user });

    // Fetch Northstar user by Slack profile email.
    const user = await fetchUserByEmail(slackApiResponse.user.profile.email);

    // Check for any Gambit Slack commands.
    const { command, arg } = parseInboundCommand(message);

    if (command === 'broadcast') {
      if (!arg) {
        return await sendSlackMessage({
          client,
          channel,
          text: 'Missing broadcast id. Example:\n\n> broadcast 2en018uiWcsMcIAWsGCQwS',
        });
      }

      const broadcastMessage = await postBroadcastMessage({
        user,
        broadcastId: arg,
      });

      const { text, attachments } = broadcastMessage;

      return await sendSlackMessage({ client, channel, text, attachments });
    }

    const replyMessage = await postMemberMessage({
      user,
      text: message.text,
      mediaUrl: command === 'photo' ? arg : null,
    });

    return await sendSlackMessage({
      client,
      channel,
      text: replyMessage ? replyMessage.text : 'Conversation is paused in `support` topic.',
    });
  } catch (error) {
    return sendSlackMessageWithError({ client, channel, error });
  }
}

module.exports = {
  reply,
};
