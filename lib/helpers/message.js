'use strict';

const logger = require('heroku-logger');

function isDirectMessageFromUser(message) {
  // Is this a direct message?
  if (message.channel[0] !== 'D') return false;

  // Ignore threaded messages.
  if (message.reply_to) return false;

  // Is this from a bot?
  if (message.bot_id || message.subtype === 'bot_message') {
    return false;
  }

  if (!message.text) return false;

  return true;
}

function parseMessage(message) {
  logger.debug('slack message received', message);
  message.command = message.text.toLowerCase().trim(); // eslint-disable-line no-param-reassign
}

module.exports = {
  isDirectMessageFromUser,
  parseMessage,
};
