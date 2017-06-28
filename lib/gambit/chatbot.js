'use strict';

const superagent = require('superagent');
const logger = require('heroku-logger');

const uri = process.env.DS_GAMBIT_CONVERSATIONS_API_BASEURI;

/**
 * @param {string} userId
 * @param {string} text
 * @param {string} mediaUrl
 * @param {string} platform
 * @return {Promise}
 */
module.exports.getReply = function (userId, text, mediaUrl, platform) {
  const data = { userId, text, mediaUrl, platform };
  logger.debug('chatbot.getReply', data);

  return new Promise((resolve, reject) => {
    superagent
      .post(`${uri}chatbot`)
      .send(data)
      .then((res) => {
        const reply = res.body.reply;
        logger.debug('chatbot.reply', reply);

        return resolve(reply);
      })
      .catch(err => reject(err));
  });
};
