/**
 * @param {Object} message
 * @return {Object}
 */
function parseInboundCommand(message) {
  const { text } = message;

  if (text.toLowerCase().trim() === 'photo') {
    return {
      command: 'photo',
      // TODO: Inspect message for attachments instead of hardcoding an image URL.
      arg: process.env.MEDIA_URL || 'https://user-images.githubusercontent.com/1236811/104386167-6d222700-54e9-11eb-90f1-f7402020e821.JPG',
    };
  }

  const params = text.split(' ');

  if (params[0].toLowerCase() === 'broadcast') {
    return {
      command: 'broadcast',
      arg: params[1],
    };
  }

  return {};
}

module.exports = {
  parseInboundCommand,
};
