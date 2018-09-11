'use strict';

const logger = require('heroku-logger');
const helpers = require('./helpers');
const gambitAdmin = require('./gambit/admin');

function getCallbackIdForCampaign(environmentName, campaign) {
  return `${environmentName}_${campaign.id}`;
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
module.exports.parseCampaignAsAttachment = function (environmentName, campaign, index) {
  logger.debug(`parseCampaignAsAttachment campaignId=${campaign.id}`);
  const gambitAdminLink = gambitAdmin.getCampaignUrl(environmentName, campaign.id);
  // For now, a campaign can only have one topic per the broadcast.campaign field.
  // TODO: Update this once we build out topic broadcasts.
  const firstTopic = campaign.topics[0];
  const keywords = firstTopic.triggers.map(trigger => trigger.toUpperCase()).join(', ');
  const webLink = helpers.getPhoenixCampaignUri(environmentName, campaign);
  const attachment = {
    callback_id: getCallbackIdForCampaign(environmentName, campaign),
    color: helpers.getHexForIndex(index),
    title: `${campaign.title} - ${keywords}`,
    title_link: helpers.getPhoenixCampaignUri(environmentName, campaign),
    fields: [
      {
        title: 'Campaign ID',
        value: campaign.id,
        short: true,
      },
      {
        title: 'Post type',
        value: firstTopic.postType,
        short: true,
      },
      {
        title: 'Links',
        value: `<${webLink}|Phoenix> | <${gambitAdminLink}|Gambit>`,
        short: true,
      },
    ],
  };
  attachment.actions = [
    {
      name: 'action',
      text: 'Send web signup',
      type: 'button',
      value: 'external-signup',
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
