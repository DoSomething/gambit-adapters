'use strict';

/**
 * @param {string} environmentName
 * @return {string}
 */
module.exports.url = function (path) {
  const baseUri = process.env.DS_GAMBIT_ADMIN_BASEURI || 'https://gambit-admin.herokuapp.com/';
  const url = `${baseUri}${path}`;

  return url;
};
