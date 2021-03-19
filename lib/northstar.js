'use strict';

const logger = require('heroku-logger');

const { GatewayClient } = require('../../../gateway-js/server');

let gatewayClient;

function getClient() {
  if (!gatewayClient) {
    gatewayClient = GatewayClient.getNewInstance();
  }
  return gatewayClient;
}

/**
 * @param {String} email
 * @return {Promise}
 */
async function fetchUserByEmail(email) {
  logger.debug('fetchUserByEmail', { email });

  const res = await module.exports.getClient().Northstar
    .Users.getByEmail(email);

  return res.data;
}


module.exports = {
  getClient,
  fetchUserByEmail,
};
