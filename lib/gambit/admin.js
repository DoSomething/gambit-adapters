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

module.exports = {
  get,
};
