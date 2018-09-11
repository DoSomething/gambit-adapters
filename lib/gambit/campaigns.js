'use strict';

const request = require('superagent');
const logger = require('heroku-logger');

/**
 * @param {string} environmentName
 * @param {string} endpoint
 * @return {Promise}
 */
function get(endpoint) {
  const path = `${process.env.DS_GAMBIT_CAMPAIGNS_API_BASEURI}/${endpoint}`;
  logger.debug('contentApi.get', { path });

  return request
    .get(path)
    .set('x-gambit-api-key', process.env.DS_GAMBIT_CAMPAIGNS_API_KEY);
}

module.exports = {
  get,
};
