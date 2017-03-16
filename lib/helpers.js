'use strict';

const request = require('superagent');
const logger = require('winston');

const colors = ['FCD116', '23b7fb', '4e2b63'];

/**
 * Returns Gambit URI for production, or Thor if set as environmentName.
 */
module.exports.gambitApiBaseUri = function (environmentName) {
  let subdomain = 'ds-mdata-responder';
  if (environmentName === 'thor') {
    subdomain = `${subdomain}-staging`;
  }

  return `https://${subdomain}.herokuapp.com/v1/`;
};

/**
 * Returns Phoenix URI for production, or Thor if set as environmentName.
 */
module.exports.phoenixBaseUri = function (environmentName) {
  let subdomain = '';
  if (environmentName === 'thor') {
    subdomain = 'thor.';
  }

  return `https://${subdomain}dosomething.org/`;
};

/**
 * Fetches Gambit campaigns on production, or for given environment.
 */
module.exports.fetchCampaigns = function (environmentName) {
  logger.debug(`fetchCampaigns:${environmentName}`);

  return new Promise((resolve, reject) => {
    const gambitCampaignsUri = `${this.gambitApiBaseUri(environmentName)}campaigns`;

    return request.get(gambitCampaignsUri)
      .then((response) => {
        const botResponse = {
          mrkdwn: true,
          text: `Gambit Campaigns running on *${environmentName.toUpperCase()}*:`,
          attachments: [],
        };

        response.body.data.forEach((campaign, index) => {
          const campaignUri = `${this.phoenixBaseUri(environmentName)}node/${campaign.id}`;
          const keywords = campaign.keywords.map(entry => entry.keyword);

          botResponse.attachments.push({
            callback_id: `${environmentName}_${campaign.id}`,
            color: `#${colors[index % 3]}`,
            title: `${campaign.title} (id: ${campaign.id})`,
            title_link: campaignUri,
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
            ],
          });
        });

        return resolve(botResponse);
      })
    .catch(err => reject(err));
  });
};

module.exports.fetchRenderedCampaignMessages = function (campaignId, environmentName) {
  logger.info(`fetchRenderedCampaignMessages:${campaignId} ${environmentName}`);

  return new Promise((resolve, reject) => {
    const gambitCampaignUri = `${this.gambitApiBaseUri(environmentName)}campaigns/${campaignId}`;

    return request.get(gambitCampaignUri)
      .then((response) => {
        const campaign = response.body.data;
        const botResponse = {
          text: `Messages for *${campaign.title}* on ${environmentName}:`,
          attachments: [],
        };

        return resolve(botResponse);
      })
      .catch(err => reject(err));
  });
};
