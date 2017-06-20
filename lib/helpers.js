'use strict';

const gambitCampaigns = require('./gambit-campaigns');

/**
 * Returns given campaign's title appended with its campaign id.
 * @param {Object} campaign
 * @return {string}
 */
module.exports.getCampaignTitleWithId = function (campaign) {
  return `${campaign.title} (id: ${campaign.id})`;
};

/**
 * Returns hex string to render a list element based on given index.
 * @param {number} index - The index number to return a color for.
 * @return {string}
 */
module.exports.getHexForIndex = function (index) {
  const colors = ['FCD116', '23b7fb', '4e2b63'];

  return `#${colors[index % colors.length]}`;
};

/**
 * Returns Phoenix URI for production, or Thor if set as environmentName.
 * @param {string} environmentName - Pass 'thor' to return Thor URI, else returns prod URI.
 * @return {string}
 */
function getPhoenixBaseUri(environmentName) {
  let subdomain = '';
  if (environmentName === 'thor') {
    subdomain = 'thor.';
  }

  return `https://${subdomain}dosomething.org/`;
}

/**
 * Returns Phoenix Campaign URI.
 * @param {string} environmentName
 * @param {object} campaign
 * @return {string}
 */
module.exports.getPhoenixCampaignUri = function (environmentName, campaign) {
  return `${getPhoenixBaseUri(environmentName)}node/${campaign.id}`;
};

/**
 * Returns Gambit Campaign URI.
 * @param {string} environmentName
 * @param {object} campaign
 * @return {string}
 */
module.exports.getGambitCampaignUri = function (environmentName, campaign) {
  return `${gambitCampaigns.getBaseUriForEnvironment(environmentName)}campaigns/${campaign.id}`;
};
