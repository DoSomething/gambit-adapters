'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./app/routes')(app);

const WINSTON_LEVEL = process.env.LOGGING_LEVEL || 'info';

const logger = require('winston');
logger.configure({
  transports: [
    new logger.transports.Console({
      prettyPrint: true,
      colorize: true,
      level: WINSTON_LEVEL,
    }),
  ],
});

return app.listen(4000, () => {
  console.log(`Slothbot is here.`);
});
