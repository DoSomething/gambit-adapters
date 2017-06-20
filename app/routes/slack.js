'use strict';

const express = require('express');
const Slack = require('@slack/client');
const helpers = require('../../lib/helpers');

const router = express.Router();

const RtmClient = Slack.RtmClient;
const WebClient = Slack.WebClient;
const RTM_EVENTS = Slack.RTM_EVENTS;
const apiToken = process.env.SLACK_API_TOKEN;
const rtm = new RtmClient(apiToken);
const web = new WebClient(apiToken);

rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, (message) => {
  // Only respond to private messages.
  if (message.channel[0] !== 'D') return null;

  // Don't reply to our sent messages.
  if (message.reply_to || message.bot_id) {
    return null;
  }

  const channel = message.channel;

  if (message.text !== 'keywords' && message.text !== 'thor') {
    return rtm.sendMessage("G'DAY MATE", channel);
  }

  rtm.sendTyping(channel);

  return helpers.fetchCampaigns('production')
    .then((response) => {
      web.chat.postMessage(channel, 'Production campaigns:', response);
    })
    .catch(err => rtm.sendMessage(err.message, channel));
});

/**
 * Accept interactive messages.
 * @see https://api.slack.com/tutorials/intro-to-message-buttons
 */
router.post('/', (req, res) => {
  const payload = JSON.parse(req.body.payload);

  if (payload.token !== process.env.SLACK_VERFICIATION_TOKEN) {
    return res.status(403).end('Access forbidden');
  }

  res.status(200).end();
  const callback = payload.callback_id;
  return rtm.sendMessage(`You selected ${callback}`, payload.channel.id);
});

module.exports = router;
