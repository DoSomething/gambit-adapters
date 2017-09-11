'use strict';

const FB = require('fb');
const logger = require('heroku-logger');
const gambitConversations = require('../../lib/gambit/conversations');

FB.setAccessToken(process.env.FB_PAGE_ACCESS_TOKEN);

/**
 * @param {object} event
 */
module.exports.receivedMessage = function (event) {
  logger.debug(`facebook.receivedMessage:${JSON.stringify(event)}`);

  if (!(event.message && event.message.text)) return;

  const data = {
    facebookId: event.sender.id,
    messageId: event.message.mid,
    text: event.message.text,
  };

  gambitConversations.postMessage(data)
    .then(res => logger.debug('gambitChatbot.postMessage success', res))
    .catch(err => logger.error('gambitChatbot.postMessage error', err));
};
