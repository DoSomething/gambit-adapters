'use strict';

const express = require('express');
const request = require('request');
const logger = require('heroku-logger');
const gambitConversations = require('../../lib/gambit/conversations');

const router = express.Router();

/**
 * Find userId and incoming text.
 */
router.use('/', (req, res, next) => {
  req.userId = req.body.From;
  req.text = req.body.Body;

  logger.debug('twilio message received', req.body);

  return next();
});

/**
 * Find URL of incoming attachment if exists.
 */
 /* eslint-disable consistent-return */
router.use('/', (req, res, next) => {
  const redirectUrl = req.body.MediaUrl0;
  if (!redirectUrl) {
    return next();
  }

  request.get(redirectUrl, (err, redirectRes) => {
    const url = redirectRes.request.uri.href;
    req.mediaUrl = url;

    return next();
  });
});
 /* eslint-enable consistent-return */

/**
 * Get chatbot reply.
 */
router.use('/', (req, res, next) => {
  gambitConversations.postMessage(req.userId, req.text, req.mediaUrl, 'twilio')
    .then((reply) => {
      req.replyText = reply.text;
      return next();
    })
    .then((err) => {
      logger.error(err);
      req.replyText = err.message;
      return next();
    });
});

module.exports = router;
