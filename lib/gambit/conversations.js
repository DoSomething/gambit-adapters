'use strict';

const superagent = require('superagent');
const logger = require('heroku-logger');

const uri = process.env.DS_GAMBIT_CONVERSATIONS_API_BASEURI;
const authName = process.env.DS_GAMBIT_CONVERSATIONS_API_BASIC_AUTH_NAME || 'puppet';
const authPass = process.env.DS_GAMBIT_CONVERSATIONS_API_BASIC_AUTH_PASS || 'totallysecret';

/**
 * @param {string} endpoint
 * @param {object} data
 @ @return {Promise}
 */
function post(endpoint, data) {
  const url = `${uri}${endpoint}`;
  logger.debug('post', { url, data });

  return superagent
    .post(url)
    .auth(authName, authPass)
    .send(data);
}

/**
 * @param {object} data
 * @return {Promise}
 */
module.exports.postInboundMessage = function (data) {
  logger.debug('chatbot.postInboundMessage', data);

  return post('receive-message', data);
};

/**
 * @param {object} data
 * @return {Promise}
 */
module.exports.postOutboundMessage = function (data) {
  logger.debug('chatbot.postOutboundMessage', data);

  return post('send-message', data);
};
