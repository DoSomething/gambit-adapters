'use strict';

const request = require('superagent');
const logger = require('winston');

/**
 * @param {string} environmentName
 * @return {string}
 */
function getBaseUriForEnvironment(environmentName) {
  let subdomain = 'ds-mdata-responder';
  if (environmentName === 'thor') {
    subdomain = `${subdomain}-staging`;
  }
  const uri = `https://${subdomain}.herokuapp.com/v1/`;

  return uri;
}

/**
 * @param {string} environmentName
 * @param {string} endpoint
 * @return {Promise}
 */
function executeGet(environmentName, endpoint) {
  const uri = getBaseUriForEnvironment(environmentName);
  const path = `${uri}${endpoint}`;
  logger.debug(`gambitCampaigns.executeGet path=${path}`);

  return request.get(path);
}

module.exports.index = function (environmentName) {
  return executeGet(environmentName, 'campaigns');
};

module.exports.get = function (environmentName, campaignId) {
  return executeGet(environmentName, `campaigns/${campaignId}`);
};
