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
  logger.debug('twilio message received', req.body);

  req.message = {
    phone: req.body.From,
    text: req.body.Body,
  };

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
    req.message.mediaUrl = url;

    return next();
  });
});
 /* eslint-enable consistent-return */

/**
 * Post message to Gambit.
 */
router.use('/', (req, res, next) => {
  gambitConversations.postMessage(req.message)
    .then((reply) => {
      req.gambitReply = reply;
      return next();
    })
    .then((err) => {
      logger.error(err);
      req.gambitReply = err;
      return next();
    });
});

router.use('/', (req, res) => {
  res.send(req.gambitReply);
});

module.exports = router;
