'use strict';

const homeRoute = require('./home');
const slackRoute = require('./slack');

module.exports = function init(app) {
  app.get('/', homeRoute);
  app.use('/slack/receive', slackRoute);
};
