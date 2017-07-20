'use strict';

const express = require('express');
const logger = require('heroku-logger');
const controller = require('../controllers/slack');

const router = express.Router();

/**
 * Posts incoming request as a Slack message.
 */
router.post('/', (req, res) => {
  const channel = req.body.channel;
  const messageText = req.body.text;
  const args = req.body.args;

  logger.debug('POST send-message', { channel, messageText, args });

  // TODO: Validate new ds-slothbot-api-key header variable.
  res.status(200).end();

  const command = messageText.toLowerCase().trim();
  if (command === 'thor') {
    return controller.postCampaignIndexMessage(channel, command);
  }
  if (command === 'keywords') {
    return controller.postCampaignIndexMessage(channel, 'production');
  }

  return controller.postMessage(channel, messageText, args);
});

module.exports = router;
