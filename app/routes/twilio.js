'use strict';

const express = require('express');
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
  logger.debug('twilio req.body', req.body);

  return next();
});

/**
 * Get chatbot reply.
 */
router.use('/', (req, res, next) => {
  chatbot.getReply(req.userId, req.text, 'twilio')
    .then((reply) => {
      req.replyText = reply.text;
      return next();
    })
    .then((err) => {
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
