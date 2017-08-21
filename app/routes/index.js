'use strict';

const homeRoute = require('./home');
const facebookRoute = require('./facebook');
const slackRoute = require('./slack');

module.exports = function init(app) {
  app.get('/', homeRoute);
  app.use('/facebook/receive', facebookRoute);
  app.use('/slack/receive', slackRoute);
};
