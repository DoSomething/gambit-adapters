'use strict';

const { GatewayClient } = require('../../../gateway-js/server');

let gatewayClient;

function getClient() {
  if (!gatewayClient) {
    gatewayClient = GatewayClient.getNewInstance();
  }
  return gatewayClient;
}

function getConfig() {
  return getClient().config;
}

/**
 * fetchUserByEmail
 *
 * @param {String} email
 * @return {Promise}
 */
async function fetchUserByEmail(email) {
  const res = await module.exports.getClient().Northstar
    .Users.getByEmail(email);

  return res.data;
}


module.exports = {
  getClient,
  getConfig,
  fetchUserByEmail,
};
