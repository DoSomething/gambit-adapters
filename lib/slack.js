'use strict';

const logger = require('heroku-logger');
const helpers = require('./helpers');

function getCallbackIdForCampaign(campaign) {
  return campaign ? campaign.id : 'null';
}

/**
 * @param {object} payload
 * @return {object}
 */
module.exports.parseCallbackId = function (payload) {
  const callbackId = payload.callback_id;
  const data = callbackId.split('_');

  return {
    campaignId: data[1],
    environmentName: data[0],
  };
};

/**
 * Parse given Campaign as an attachment for a Slack message.
 * @param {string} environmentName
 * @param {object} campaign
 * @param {number} index
 * @return {object}
 */
module.exports.parseCampaignAsAttachment = function (campaign, index) {
  if (!campaign || !campaign.id) {
    return {};
  }

  const attachment = {
    callback_id: getCallbackIdForCampaign(campaign),
    color: helpers.getHexForIndex(index),
    title: helpers.getCampaignTitleWithId(campaign),
  };
  attachment.actions = [
    {
      name: 'action',
      text: 'Send test',
      type: 'button',
      value: 'webSignup',
    },
  ];
  logger.trace('parseCampaignAsAttachment', attachment);

  return attachment;
};

/**
 * @param {Error} error
 * @return {Object}
 */
module.exports.getMessageFromError = function (error) {
  const statusText = error.status ? ` with status *${error.status}*` : '';
  let errorMessageText = error.message;
  if (error.response && error.response.body) {
    errorMessageText = error.response.body.message;
  }
  return {
    text: `Whoops, an error${statusText} occurred:`,
    attachments: [{
      color: 'danger',
      text: errorMessageText || 'Internal server error',
    }],
  };
};
