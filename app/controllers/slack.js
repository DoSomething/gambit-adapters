'use strict';

const Slack = require('@slack/client');
const logger = require('heroku-logger');

const gambitCampaigns = require('../../lib/gambit-campaigns');
const slack = require('../../lib/slack');

const WebClient = Slack.WebClient;
const RtmClient = Slack.RtmClient;
const apiToken = process.env.SLACK_API_TOKEN;
const rtm = new RtmClient(apiToken);
const web = new WebClient(apiToken);

rtm.start();

rtm.on(Slack.CLIENT_EVENTS.RTM.AUTHENTICATED, (res) => {
  const bot = res.self.name;
  const team = res.team.name;

  logger.info('Slack.RtmClient authenticated.', { bot, team });
});

/**
 * Posts Campaign List Message to given Slack channel for given environmentName.
 * @param {object} channel
 * @param {string} environmentName
 * @return {Promise}
 */
module.exports.postCampaignIndexMessage = function (channel, environmentName) {
  rtm.sendTyping(channel);

  return gambitCampaigns.index(environmentName)
    .then((response) => {
      const text = `Gambit ${environmentName.toUpperCase()} campaigns:`;
      const attachments = response.body.data.map((campaign, index) => {
        const attachment = slack.parseCampaignAsAttachment(environmentName, campaign, index);
        return attachment;
      });

      return this.postMessage(channel, text, { attachments });
    })
    .then(() => logger.debug('postCampaignIndexMessage', { channel, environmentName }))
    .catch((err) => {
      this.postMessage(channel, err.message);
      logger.error('postCampaignIndexMessage', err);
    });
};

/**
 * Posts Campaign Detail Message to given Slack channel for given environmentName and campaignId.
 * @param {object} channel
 * @param {string} environmentName
 * @param {number} campaignId
 * @return {Promise}
 */
module.exports.postCampaignDetailMessage = function (channel, environmentName, campaignId) {
  rtm.sendTyping(channel);

  return gambitCampaigns.get(environmentName, campaignId)
    .then((response) => {
      const campaign = response.body.data;
      const text = slack.getCampaignDetailText(environmentName, campaign);
      const templates = Object.keys(campaign.messages);
      const attachments = templates.map((template, index) => {
        const messageData = campaign.messages[template];

        return slack.parseCampaignMessageAsAttachment(template, messageData, index);
      });

      return this.postMessage(channel, text, { attachments });
    })
    .then(() => logger.debug(`campaignGet channel=${channel} environment=${environmentName}`))
    .catch((err) => {
      this.postMessage(channel, err.message);
      logger.error('postCampaignDetailMessage', err);
    });
};

/**
 * Posts given messageText to given Slack channel.
 * @param {string} channel
 * @param {string} messageText
 */
module.exports.postMessage = function (channel, messageText, args) {
  web.chat.postMessage(channel, messageText, args);
};
