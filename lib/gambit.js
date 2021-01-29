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
async function post(endpoint, query = {}, data = {}) {
  const url = `${config.baseUri}/${endpoint}`;

  logger.debug('gambit.post', { url, query, data });

  return await request.post(url)
    .query(query)
    .send(data)
    .auth(config.auth.name, config.auth.pass);
}

/**
 * @param {String} origin
 * @param {Object} data
 * @return {Promise}
 */
async function postMessageWithOriginAndData(origin, data) {
  return await post('messages', { origin }, data);
}

/**
 * @param {String} userId
 * @param {String} broadcastId
 * @return {Promise}
 */
async function postBroadcastMessage(userId, broadcastId) {
  return await postMessageWithOriginAndData('broadcast', { userId, broadcastId, platform });
}

/**
 * @param {String} userId
 * @param {String} text
 * @param {String} mediaUrl
 * @return {Promise}
 */
async function postMemberMessage(userId, text, mediaUrl) {
  return await postMessageWithOriginAndData(platform, { userId, text, mediaUrl });
}

module.exports = {
  post,
  postBroadcastMessage,
  postMemberMessage,
};
