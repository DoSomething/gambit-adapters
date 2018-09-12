'use strict';

const helpers = require('./helpers/index');

// register helpers
Object.keys(helpers).forEach((helperName) => {
  module.exports[helperName] = helpers[helperName];
});

/**
 * Returns given campaign's title appended with its campaign id.
 * @param {Object} campaign
 * @return {string}
 */
module.exports.getCampaignTitleWithId = function (campaign) {
  return `${campaign.title} (id: ${campaign.id})`;
};

/**
 * Returns hex string to render a list element based on given index.
 * @param {number} index - The index number to return a color for.
 * @return {string}
 */
module.exports.getHexForIndex = function (index) {
  const colors = ['FCD116', '23b7fb', '4e2b63'];

  return `#${colors[index % colors.length]}`;
};
