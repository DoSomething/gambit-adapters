'use strict';

/**
 * @param {string} path
 * @return {string}
 */
function url(environmentName, path) {
  let subdomain = 'gambit-admin';
  if (environmentName === 'thor') {
    subdomain = `${subdomain}-staging`;
  }
  const baseUri = `https://${subdomain}.herokuapp.com`;
  const result = `${baseUri}/${path}`;

  return result;
}

module.exports.getCampaignUrl = function (environmentName, campaignId) {
  return url(environmentName, `campaigns/${campaignId}`);
};
