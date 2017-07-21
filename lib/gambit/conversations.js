'use strict';

const superagent = require('superagent');
const logger = require('heroku-logger');

const uri = process.env.DS_GAMBIT_CONVERSATIONS_API_BASEURI;

/**
 * @param {object} data
 * @return {Promise}
 */
module.exports.postMessage = function (data) {
  logger.debug('chatbot.postMessage', data);

  return new Promise((resolve, reject) => {
    superagent
      .post(`${uri}receive-message`)
      .send(data)
      .then((res) => {
        const reply = res.body.reply;
        logger.debug('chatbot.postMessage success', reply);

        return resolve(reply);
      })
      .catch(err => reject(err));
  });
};
