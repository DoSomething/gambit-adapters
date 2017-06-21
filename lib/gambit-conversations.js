'use strict';

const request = require('superagent');
const logger = require('winston');

/**
 * @param {string} endpoint
 * @param {object} data
 * @return {Promise}
 */
function executePost(endpoint, data) {
  const uri = process.env.DS_GAMBIT_CONVERSATIONS_API_BASEURI;
  const path = `${uri}${endpoint}`;
  logger.debug(`gambitCampaigns.executeGet path=${path}`);

  return request.post(path).send(data);
}

/**
 * @param {string} userId
 * @param {string} message
 * @return {Promise}
 */
module.exports.postUserMessage = function (userId, message) {
  const data = { userId, message };

  return new Promise((resolve, reject) => {
    executePost('chatbot', data)
      .then(res => resolve(res.body.response.message))
      .catch(err => reject(err));
  });
};
