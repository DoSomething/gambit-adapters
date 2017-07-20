'use strict';

const homeRoute = require('./home');
const sendMessageRoute = require('./send-message');
const slackRoute = require('./slack');

module.exports = function init(app) {
  app.get('/', homeRoute);
  app.use('/send-message', sendMessageRoute);
  app.use('/slack/receive', slackRoute);
};
