'use strict';

const logger = require('heroku-logger');

const config = require('../../config/lib/helpers/message');

function parseMessage(message) {
  logger.debug('slack message received', message);

  /* eslint-disable no-param-reassign */
 
  message.command = message.text.toLowerCase().trim();

  // TODO: Inspect message for attachments instead of hardcoding an image URL.
  if (message.command === 'photo') {
    message.mediaUrl = config.media.url;
  }

  const params = message.text.split(' ');

  if (params[0].toLowerCase() === 'broadcast') {
    message.command = 'broadcast';
    message.broadcastId = params[1];
  }

  /* eslint-enable no-param-reassign */
}

module.exports = {
  parseMessage,
};
