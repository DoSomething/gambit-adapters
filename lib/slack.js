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
  const templatesLink = gambitAdmin.getCampaignUrl(environmentName, campaign.id);
  const messagesLink = `${templatesLink}?skip=0`;
  const keywords = campaign.keywords.join(', ');
  const attachment = {
    callback_id: getCallbackIdForCampaign(environmentName, campaign),
    color: helpers.getHexForIndex(index),
    title: `${campaign.title} - ${keywords}`,
    title_link: helpers.getPhoenixCampaignUri(environmentName, campaign),
    fields: [
      {
        title: 'Campaign Status',
        value: campaign.status,
        short: true,
      },
      {
        title: 'Gambit Links',
        value: `<${templatesLink}|Templates> | <${messagesLink}|Messages>`,
        short: true,
      },
    ],
  };
  if (environmentName !== 'production') {
    attachment.actions = [
      {
        name: 'action',
        text: 'Test web signup',
        type: 'button',
        value: 'external-signup',
      },
    ];
  }
  logger.trace('parseCampaignAsAttachment', attachment);

  return attachment;
};

/**
 * @param {string} environmentName
 * @param {object} campaign
 * @return {string}
 */
module.exports.getCampaignDetailText = function (environmentName, campaign) {
  let text = `${environmentName.toUpperCase()}: *${campaign.title}*`;
  text = `${text}\n<${helpers.getGambitCampaignUri(environmentName, campaign)}|JSON>`;

  return text;
};
