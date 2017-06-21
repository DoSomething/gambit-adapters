'use strict';

const request = require('superagent');
const logger = require('winston');

/**
 * @param {string} environmentName
 * @return {string}
 */
module.exports.getBaseUriForEnvironment = function (environmentName) {
  let subdomain = 'ds-mdata-responder';
  if (environmentName === 'thor') {
    subdomain = `${subdomain}-staging`;
  }
  const uri = `https://${subdomain}.herokuapp.com/v1/`;

  return uri;
};

/**
 * @param {string} environmentName
 * @param {string} endpoint
 * @return {Promise}
 */
function executeGet(environmentName, endpoint) {
  const uri = exports.getBaseUriForEnvironment(environmentName);
  const path = `${uri}${endpoint}`;
  logger.debug(`gambitCampaigns.executeGet path=${path}`);

  return request.get(path);
}

/**
 * @param {string} environmentName
 * @return {Promise}
 */
module.exports.index = function (environmentName) {
  return executeGet(environmentName, 'campaigns');
};

/**
 * @param {string} environmentName
 * @param {number} campaignId
 * @return {Promise}
 */
module.exports.get = function (environmentName, campaignId) {
  return executeGet(environmentName, `campaigns/${campaignId}`);
};
