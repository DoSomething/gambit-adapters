'use strict';

/**
 * Imports.
 */
const Northstar = require('@dosomething/northstar-js');
const logger = require('heroku-logger');
const config = require('../config/lib/northstar');

/**
 * Setup.
 */
let client;

/**
 * @return {Object}
 */
module.exports.createNewClient = function createNewClient() {
  const loggerMsg = 'northstar.createNewClient';

  try {
    client = new Northstar(config.clientOptions);
    logger.info(`${loggerMsg} success`);
  } catch (err) {
    logger.error(`${loggerMsg} error`, err);
    throw new Error(err.message);
  }
  return client;
};

/**
 * @return {Object}
 */
module.exports.getClient = function getClient() {
  if (!client) {
    return exports.createNewClient();
  }
  return client;
};

/**
 * @param {string} email
 * @return {Promise}
 */
module.exports.fetchUserByEmail = function (email) {
  logger.debug('fetchUserByEmail', { email });

  return exports.getClient().Users.get('email', email);
};

