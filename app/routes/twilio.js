'use strict';

const express = require('express');
const request = require('request');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const logger = require('heroku-logger');
const chatbot = require('../../lib/gambit/chatbot');

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
router.use('/', (req, res, next) => {
  const redirectUrl = req.body.MediaUrl0;
  if (!redirectUrl) {
    return next();
  }

  request.get(redirectUrl, (err, res) => {
    const url = res.request.uri.href;
    req.mediaUrl = url;

    return next();
  });
});

/**
 * Get chatbot reply.
 */
router.use('/', (req, res, next) => {
  chatbot.getReply(req.userId, req.text, req.mediaUrl, 'twilio')
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

/**
 * Send Twilio response.
 */
router.post('/', (req, res) => {
  if (!req.replyText) return res.send();

  const twiml = new MessagingResponse();
  twiml.message(req.replyText);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  return res.end(twiml.toString());
});

module.exports = router;
