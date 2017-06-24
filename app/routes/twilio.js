'use strict';

const express = require('express');
const controller = require('../controllers/twilio');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const router = express.Router();

router.use('/', (req, res, next) => {
  req.userId = req.body.From;
  req.text = req.body.Body;

  console.log(`${req.userId} sent:${req.text}`);
  return next();
});

router.post('/', (req, res) => {
  const twiml = new MessagingResponse();

  twiml.message(`You said:${req.text}`);

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

module.exports = router;
