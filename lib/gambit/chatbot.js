'use strict';

const superagent = require('superagent');
const logger = require('winston');

const uri = process.env.DS_GAMBIT_CONVERSATIONS_API_BASEURI;

/**
 * @param {string} userId
 * @param {string} messageText
 * @param {string} platform
 * @return {Promise}
 */
module.exports.getReply = function (userId, text, platform) {
  const data = { userId, text, platform };
  logger.debug(`chatbot.getReply ${JSON.stringify(data)}`);

  return new Promise((resolve, reject) => {
    superagent
      .post(`${uri}chatbot`)
      .send(data)
      .then(res => resolve(res.body.reply.text))
      .catch(err => reject(err));
  });
};
