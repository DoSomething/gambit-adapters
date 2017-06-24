'use strict';

const express = require('express');
const logger = require('heroku-logger');
const controller = require('../controllers/facebook');

const router = express.Router();

const verifyToken = process.env.FB_MESSENGER_VERIFY_TOKEN;

/**
 * Simple Messenger app to demo Gambit Conversations API via Messenger.
 * @see https://developers.facebook.com/docs/messenger-platform/guides/quick-start
 */

/**
 * Used by FB to verify webhook.
 */
router.get('/', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === verifyToken) {
    logger.info('facebook.get: validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    logger.error('facebook.get: failed validation. make sure the validation tokens match.');
    res.sendStatus(403);
  }
});

/**
 * Used by FB to post messaging events.
 */
router.post('/', (req, res) => {
  const data = req.body;

  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched.
    data.entry.forEach((entry) => {
      // Iterate over each messaging event.
      entry.messaging.forEach((event) => {
        if (event.message) {
          controller.receivedMessage(event);
        } else {
          logger.debug(`facebook.post: ignoring event:${JSON.stringify(event)}`);
        }
      });
    });

    res.sendStatus(200);
  }
});

module.exports = router;
