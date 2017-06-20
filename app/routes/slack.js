'use strict';

const express = require('express');
const Slack = require('@slack/client');

const router = express.Router();

const RtmClient = Slack.RtmClient;
const RTM_EVENTS = Slack.RTM_EVENTS;
const apiToken = process.env.SLACK_API_TOKEN || '';
const rtm = new RtmClient(apiToken);

rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, (message) => {
  // Only respond to private messages.
  if (message.channel[0] !== 'D') return;

  rtm.sendMessage("G'DAY MATE", message.channel);
});

module.exports = router;
