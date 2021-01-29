'use strict';

const logger = require('heroku-logger');
const config = require('../../config/lib/helpers/message');

/**
 * @param {Object} message
 * @return {Object}
 */
function parseMessageCommand(message) { 
  // TODO: Inspect message for attachments instead of hardcoding an image URL.
  if (message.text.toLowerCase().trim() === 'photo') {
    return {
      command: 'photo',
      arg: config.media.url,
    };
  }

  const params = message.text.split(' ');

  if (params[0].toLowerCase() === 'broadcast') {
    return {
      command: 'broadcast',
      arg: params[1],
    };
  }

  return {};
}

module.exports = {
  parseMessageCommand,
};
