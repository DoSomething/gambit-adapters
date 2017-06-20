'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
// parse application/json Content-Type
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded Content-Type
app.use(bodyParser.urlencoded({ extended: true }));
// require all routes
require('./app/routes')(app);

return app.listen(4000, () => {
  console.log(`Slothbot is here.`);
});
