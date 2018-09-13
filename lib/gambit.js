'use strict';

const request = require('superagent');
const logger = require('heroku-logger');
const config = require('../config/lib/gambit').clientOptions;

const apiUri = `${config.baseUri}/api`;

const platform = 'gambit-slack';

/**
 * @param {String} endpoint
 * @param {Object} query
 * @return {Promise}
 */
function get(endpoint, query = {}) {
  const url = `${apiUri}/${endpoint}`;
  logger.debug('contentApi.get', { url });

  return request
    .get(url)
    .query(query)
    .auth(config.auth.name, config.auth.pass);
}

/**
 * @param {String} endpoint
 * @param {Object} query
 * @param {Object} data
 * @return {Promise}
 */
function post(endpoint, query = {}, data = {}) {
  const url = `${apiUri}/${endpoint}`;
  logger.debug('contentApi.post', { url, query, data });

  return request
    .post(url)
    .query(query)
    .send(data)
    .auth(config.auth.name, config.auth.pass);
}

/**
 * @param {String} origin
 * @param {Object} data
 * @return {Promise}
 */
function postMessageWithOriginAndData(origin, data) {
  logger.debug('postMessage', { origin, data });
  return post('messages', { origin }, data);
}

/**
 * @param {String} userId
 * @param {String} broadcastId
 * @return {Promise}
 */
function postBroadcastMessage(userId, broadcastId) {
  return postMessageWithOriginAndData('broadcast', { userId, broadcastId, platform });
}

/**
 * @param {String} userId
 * @param {String} text
 * @param {String} mediaUrl
 * @return {Promise}
 */
function postMemberMessage(userId, text, mediaUrl) {
  return postMessageWithOriginAndData(platform, { userId, text, mediaUrl });
}

/**
 * @param {String} userId
 * @param {Number} campaignId
 * @return {Promise}
 */
function postSignupMessage(userId, campaignId) {
  return postMessageWithOriginAndData('signup', { userId, campaignId, platform });
}

module.exports = {
  get,
  post,
  postBroadcastMessage,
  postMemberMessage,
  postSignupMessage,
};