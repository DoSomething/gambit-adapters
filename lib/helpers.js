'use strict';

const helpers = require('./helpers/index');

// register helpers
Object.keys(helpers).forEach((helperName) => {
  module.exports[helperName] = helpers[helperName];
});
