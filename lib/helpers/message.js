'use strict';

function isDirectMessageFromUser(message) {
  // Is this a direct message?
  if (message.channel[0] !== 'D') return false;

  // Ignore threaded messages.
  if (message.reply_to) return false;

  // Is this from a bot?
  if (message.bot_id || message.subtype === 'bot_message') {
    return false;
  }

  return true;
}

module.exports = {
  isDirectMessageFromUser,
};
