'use strict';

const request = require('superagent');
const logger = require('heroku-logger');
const config = require('../config/lib/gambit').clientOptions;

const platform = 'gambit-slack';

/**
 * @param {String} endpoint
 * @param {Object} query
 * @param {Object} data
 * @return {Promise}
 */
function post(endpoint, query = {}, data = {}) {
  const url = `${config.baseUri}/${endpoint}`;

  logger.debug('gambit.post', { url, query, data });

  return request.post(url)
    .query(query)
    .send(data)
    .auth(config.auth.name, config.auth.pass);
}

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
 * @param {String} origin
 * @param {Object} data
 * @return {Promise}
 */
async function postMessageWithOriginAndData(origin, data) {
  const json = await post('messages', { origin }, data);

  return parseOutboundMessage(json);
}

/**
 * @param {Object} user
 * @param {String} broadcastId
 * @return {Promise}
 */
module.exports.postBroadcastMessage = ({ user, broadcastId }) =>
  postMessageWithOriginAndData('broadcastLite', {
    broadcastId,
    mobile: user.mobile,
    platform,
    smsStatus: user.sms_status,
    userId: user.id,
  });

/**
 * @param {Object} user
 * @param {String} text
 * @param {String} mediaUrl
 * @return {Promise}
 */
module.exports.postMemberMessage = ({ user, text, mediaUrl }) =>
  postMessageWithOriginAndData(platform, {
    mediaUrl,
    text,
    userId: user.id,
  });
