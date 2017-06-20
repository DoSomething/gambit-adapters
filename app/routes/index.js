'use strict';

const slackRoute = require('./slack');
const homeRoute = require('./home');

module.exports = function init(app) {
  app.get('/', homeRoute);
  app.use('/slack/receive', slackRoute);
};
