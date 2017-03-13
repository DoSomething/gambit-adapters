'use strict';

/**
 * Returns Gambit URI for production, or Thor if set as environmentName.
 */
module.exports.gambitApiBaseUri = function (environmentName) {
  let subdomain = 'ds-mdata-responder';
  if (environmentName === 'thor') {
    subdomain = `${subdomain}-staging`;
  }

  return `https://${subdomain}.herokuapp.com/v1/`;
};

/**
 * Returns Phoenix URI for production, or Thor if set as environmentName.
 */
module.exports.phoenixBaseUri = function (environmentName) {
  let subdomain = '';
  if (environmentName === 'thor') {
    subdomain = 'thor.';
  }

  return `https://${subdomain}dosomething.org/`;
};
