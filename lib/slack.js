'use strict';

const logger = require('winston');
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

  let text = `Doing: ${uri}/${campaign.mobilecommons_group_doing}`;
  text = `${text}\nCompleted: ${uri}/${campaign.mobilecommons_group_completed}\n`;

  return text;
}

/**
 * @param {string} callbackId
 * @return {object}
 */
module.exports.parseCallbackId = function (callbackId) {
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
  const keywords = campaign.keywords.map(entry => entry.keyword);

  const attachment = {
    callback_id: getCallbackIdForCampaign(environmentName, campaign),
    color: helpers.getHexForIndex(index),
    title: helpers.getCampaignTitleWithId(campaign),
    title_link: helpers.getCampaignUri(environmentName, campaign),
    actions: [
      {
        name: 'action',
        text: 'View messages',
        type: 'button',
        value: 'messages',
      },
    ],
    fields: [
      {
        title: 'Keywords',
        value: keywords.join(', '),
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
  logger.debug(attachment);

  return attachment;
};
