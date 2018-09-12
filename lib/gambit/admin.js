'use strict';

const request = require('superagent');
const logger = require('heroku-logger');

/**
 * @param {String} endpoint
 * @param {Object} query
 * @return {Promise}
 */
function get(endpoint, query = {}) {
  const url = `${process.env.DS_GAMBIT_ADMIN_BASEURI}/api/${endpoint}`;
  logger.debug('contentApi.get', { url });

  return request
    .get(url)
    .query(query)
    .auth(process.env.DS_GAMBIT_ADMIN_BASIC_AUTH_NAME, process.env.DS_GAMBIT_ADMIN_BASIC_AUTH_PASS);
}

/**
 * @param {String} endpoint
 * @param {Object} query
 * @param {Object} data
 * @return {Promise}
 */
function post(endpoint, query = {}, data = {}) {
  const url = `${process.env.DS_GAMBIT_ADMIN_BASEURI}/api/${endpoint}`;
  logger.debug('contentApi.post', { url, query, data });

  return request
    .post(url)
    .query(query)
    .send(data)
    .auth(process.env.DS_GAMBIT_ADMIN_BASIC_AUTH_NAME, process.env.DS_GAMBIT_ADMIN_BASIC_AUTH_PASS);
}

/**
 * @param {String} origin
 * @param {Object} data
 * @return {Promise}
 */
function postMessage(origin, data) {
  return post('messages', { origin }, data);
}

/**
 * @param {Object} data
 * @return {Promise}
 */
function postBroadcastMessage(data) {
  return postMessage('broadcast', data);
}

/**
 * @param {Object} data
 * @return {Promise}
 */
function postMemberMessage(data) {
  return postMessage('gambit-slack', data);
}

/**
 * @param {Object} data
 * @return {Promise}
 */
function postSignupMessage(data) {
  return postMessage('signup', data);
}

module.exports = {
  get,
  post,
  postBroadcastMessage,
  postMemberMessage,
  postSignupMessage,
};
