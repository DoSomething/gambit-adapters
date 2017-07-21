'use strict';

const FB = require('fb');
const logger = require('heroku-logger');
const gambitConversations = require('../../lib/gambit/conversations');

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

  if (! (event.message && event.message.text)) return;

  const data = {
    facebookId: event.sender.id,
    text: event.message.text,
  };

  return gambitConversations.postMessage(data)
    .then(res => logger.debug('gambitChatbot.postMessage success', res))
    .catch(err => postFacebookMessage(facebookId, err.message));
};
