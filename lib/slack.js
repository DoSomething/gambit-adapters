'use strict';

const logger = require('heroku-logger');
const helpers = require('./helpers');
const gambitAdmin = require('./gambit/admin');

function getCallbackIdForCampaign(environmentName, campaign) {
  return `${environmentName}_${campaign.id}`;
}

/**
 * @param {object} campaign
 * @return {string}
 */
function getMobileCommonsGroupsText(campaign) {
  const uri = 'https://secure.mcommons.com/groups';

  let text = `- Doing: ${uri}/${campaign.mobilecommons_group_doing}`;
  text = `${text}\n- Completed: ${uri}/${campaign.mobilecommons_group_completed}\n`;

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
    title_link: helpers.getPhoenixCampaignUri(environmentName, campaign),
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
  text = `${text}\n - Raw: ${helpers.getGambitCampaignUri(environmentName, campaign)}`;
  text = `${text}\n - Edit: ${campaign.contentfulUri}`;

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

/**
 * Returns text to display for a given Action with type === 'updateUserPaused'.
 * @param {object} action
 * @return {string}
 */
module.exports.parseUpdateUserPausedActionAsMessage = function (action) {
  const user = action.data.user;
  const userId = `User ${user._id}`;
  const profileLink = gambitAdmin.getUserProfileUrl(user._id);
  const attachment = {
    title: userId,
    title_link: profileLink,
    fallback: profileLink,
  };

  let text;
  let color;

  if (!user.paused) {
    text = 'Unpaused: user cancelled';
    color = '#ddd';
  } else if (user.topic === 'supportQuestion') {
    text = 'Paused: user question';
    color = helpers.getHexForIndex(1);
  } else if (user.topic === 'supportCrisis') {
    text = 'Paused: flagged crisis';
    color = 'danger';
  } else {
    text = 'Paused: flagged warning';
    color = 'warning';
  }
  attachment.color = color;

  const message = {
    text,
    attachments: [attachment],
  };

  return message;
};
