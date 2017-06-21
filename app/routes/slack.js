'use strict';

const express = require('express');
const controller = require('../controllers/slack');
const slack = require('../../lib/slack');

const router = express.Router();

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
  const channelId = payload.channel.id;
  const data = slack.parseCallbackId(payload.callback_id);

  return controller.sendCampaignDetailMessage(channelId, data.environmentName, data.campaignId);
});

module.exports = router;
