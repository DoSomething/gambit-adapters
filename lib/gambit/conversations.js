'use strict';

const superagent = require('superagent');
const logger = require('heroku-logger');

const uri = process.env.DS_GAMBIT_CONVERSATIONS_API_BASEURI;

/**
 * @param {object} conversation
 * @param {string} text
 * @param {string} mediaUrl
 * @param {string} platform
 * @return {Promise}
 */
module.exports.postMessage = function (conversation, text, mediaUrl, platform) {
  const data = { conversation, text, mediaUrl, platform };
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


module.exports.getActions = function (since) {
  logger.trace('chatbot.getActions');
  let query;

  if (since) {
    query = { query: `{"date":{"$gt":"${since}"}}` };
    logger.trace('query', query);
  }

  return new Promise((resolve, reject) => {
    superagent
      .get(`${uri}actions`)
      .query(query)
      .then(res => resolve(res.body))
      .catch(err => reject(err));
  });
};
