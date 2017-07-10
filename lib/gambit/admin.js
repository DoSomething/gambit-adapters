'use strict';

/**
 * @param {string} path
 * @return {string}
 */
function url(path) {
  const baseUri = process.env.DS_GAMBIT_ADMIN_BASEURI || 'https://gambit-admin.herokuapp.com/';
  const result = `${baseUri}${path}`;

  return result;
}

module.exports.getUserProfileUrl = function (userId) {
  return url(`users/${userId}`);
};
