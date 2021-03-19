'use strict';

const logger = require('heroku-logger');

const { GatewayClient } = require('../../../gateway-js/server');

let client;

/**
 * @return {GatewayClient}
 */
module.exports.getClient = () => {
  if (!client) {
    client = GatewayClient.getNewInstance();
  }

  return client;
};

/**
 * @param {String} email
 * @return {Promise}
 */
module.exports.fetchUserByEmail = async (email) => {
  logger.debug('fetchUserByEmail', { email });

  const res = await module.exports.getClient().Northstar
    .Users.getByEmail(email);

  return res.data;
};
