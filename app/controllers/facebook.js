'use strict';

const FB = require('fb');
const logger = require('winston');
const gambitChatbot = require('../../lib/gambit/chatbot');

FB.setAccessToken(process.env.FB_PAGE_ACCESS_TOKEN);

/**
 * @param {string} recipientId
 * @param {string} messageText
 * @return {object}
 */
function formatPayload(recipientId, messageText) {
  const data = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
    },
  };

  return data;
}

/**
 * @param {object} messageData
 * @param {string} messageText
 */
function postFacebookMessage(recipientId, messageText) {
  const data = formatPayload(recipientId, messageText);

  FB.api('me/messages', 'post', data, (res) => {
    if (!res || res.error) {
      logger.error(!res ? 'error occurred' : res.error);
      return;
    }

    logger.debug(res);
  });
}

/**
 * @param {object} event
 */
module.exports.receivedMessage = function (event) {
  logger.debug(`facebook.receivedMessage:${JSON.stringify(event)}`);

  const userId = event.sender.id;
  const message = event.message;
  const messageText = message.text;

  if (messageText) {
    gambitChatbot.getReply(userId, messageText, 'facebook')
      .then((reply) => {
        if (!reply.text) return true;

        return postFacebookMessage(userId, reply.text);
      })
      .catch(err => postFacebookMessage(userId, err.message));
  }
};
