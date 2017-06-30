'use strict';

const events = require('events');
const logger = require('heroku-logger');
const gambitChatbot = require('./gambit/chatbot');
const slackbot = require('../app/controllers/slack');

const eventEmitter = new events.EventEmitter();
let sinceDate = new Date();

eventEmitter.addListener('chatbotAction', (action) => {
  slackbot.postMessageForAction(action);
});

module.exports.pollActions = function () {
  logger.trace('pollActions', { sinceDate });

  gambitChatbot.getActions(sinceDate)
    .then((actions) => {
      if (!actions.length) {
        logger.trace('no new Slothie actions');
      }

      actions.forEach((action, index) => {
        eventEmitter.emit('chatbotAction', action);
        if (index === actions.length - 1) {
          sinceDate = action.date;
        }
      });
    })
    .catch(err => logger.error(err));
};
