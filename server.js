'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./lib/slack');
require('./routes')(app);

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

const port = process.env.PORT || 4000;
return app.listen(port, () => {
  logger.info(`Gambit Slack is running on port=${port}.`);
});
