'use strict';

const logger = require('heroku-logger');
const helpers = require('./helpers');

function getCallbackIdForCampaign(environmentName, campaign) {
  return `${environmentName}_${campaign.id}`;
}

/**
 * @param {object} campaign
 * @return {string}
 */
function getMobileCommonsGroupsText(campaign) {
  const uri = 'https://secure.mcommons.com/groups';
  const doingUrl = `${uri}/${campaign.mobilecommons_group_doing}`;
  const completedUrl = `${uri}/${campaign.mobilecommons_group_completed}`;

  // Render links
  // @see https://api.slack.com/docs/message-formatting#linking_to_urls
  const text = `<${doingUrl}|Doing> | <${completedUrl}|Completed>`;

  return text;
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

  const attachment = {
    callback_id: getCallbackIdForCampaign(environmentName, campaign),
    color: helpers.getHexForIndex(index),
    title: helpers.getCampaignTitleWithId(campaign),
    title_link: helpers.getPhoenixCampaignUri(environmentName, campaign),
    actions: [
      {
        name: 'action',
        text: 'View messages',
        type: 'button',
        value: 'view-messages',
      },
      {
        name: 'action',
        text: 'Test web signup',
        type: 'button',
        value: 'external-signup',
      },
    ],
    fields: [
      {
        title: 'Keywords',
        value: campaign.keywords.join(', '),
        short: true,
      },
      {
        title: 'Status',
        value: campaign.status,
        short: true,
      },
      {
        title: 'Groups',
        value: getMobileCommonsGroupsText(campaign),
        short: false,
      },
    ],
  };
  logger.trace('parseCampaignAsAttachment', attachment);

  return attachment;
};

/**
 * @param {string} environmentName
 * @param {object} campaign
 * @return {string}
 */
module.exports.getCampaignDetailText = function (environmentName, campaign) {
  let text = `${environmentName.toUpperCase()}: *${helpers.getCampaignTitleWithId(campaign)}*`;
  text = `${text}\n<${helpers.getGambitCampaignUri(environmentName, campaign)}|JSON>`;

  return text;
};

/**
 * Parse given Campaign Message object as an attachment for a Slack message.
 * @param {string} messageType
 * @param {object} messageData
 * @param {number} index
 * @return {object}
 */
module.exports.parseCampaignMessageAsAttachment = function (messageType, messageData, index) {
  // TODO: Move definition to config.
  const iconUri = 'https://cdn-images-1.medium.com/fit/c/200/200/0*YoWgEvVaSo21Jygb.jpeg';

  const attachment = {
    title: messageType,
    color: helpers.getHexForIndex(index),
    text: messageData.rendered,
  };
  if (messageData.override === true) {
    attachment.title = `${attachment.title}**`;
    attachment.footer = '**Overridden in Contentful';
    attachment.footer_icon = iconUri;
  }
  if (!attachment.text) {
    attachment.text = 'N/A';
  }
  logger.trace('parseCampaignMessageAsAttachment', attachment);

  return attachment;
};
