'use strict';

const request = require('superagent');
const logger = require('winston');

const doSomethingIconUri = 'https://cdn-images-1.medium.com/fit/c/200/200/0*YoWgEvVaSo21Jygb.jpeg';

/**
 * Returns given campaign's title appended with its campaign id.
 * @param {Object} campaign
 * @return {string}
 */
function campaignTitleWithId(campaign) {
  return `${campaign.title} (id: ${campaign.id})`;
}

/**
 * Returns hex string to render a list element based on given index.
 * @param {number} index - The index number to return a color for.
 * @return {string}
 */
function hexForIndex(index) {
  const colors = ['FCD116', '23b7fb', '4e2b63'];

  return `#${colors[index % colors.length]}`;
}

/**
 * Returns Gambit URI for production, or Thor if passed as environmentName.
 * @param {string} environmentName - Pass 'thor' to return Thor URI, else returns prod URI.
 * @return {string}
 */
function gambitApiBaseUri(environmentName) {
  let subdomain = 'ds-mdata-responder';
  if (environmentName === 'thor') {
    subdomain = `${subdomain}-staging`;
  }

  return `https://${subdomain}.herokuapp.com/v1/`;
}

/**
 * Returns Phoenix URI for production, or Thor if set as environmentName.
 * @param {string} environmentName - Pass 'thor' to return Thor URI, else returns prod URI.
 * @return {string}
 */
function phoenixBaseUri(environmentName) {
  let subdomain = '';
  if (environmentName === 'thor') {
    subdomain = 'thor.';
  }

  return `https://${subdomain}dosomething.org/`;
}

/**
 * Fetches Gambit campaigns for the given environmentName and renders them as attachments of an
 * outgoing Slack message.
 *
 * @param {string} environmentName - Pass 'thor' to return Thor URI, else returns prod URI.
 * @return {Promise}
 */
module.exports.fetchCampaigns = function (environmentName) {
  logger.debug(`fetchCampaigns:${environmentName}`);

  return new Promise((resolve, reject) => {
    const gambitCampaignsUri = `${gambitApiBaseUri(environmentName)}campaigns`;

    return request.get(gambitCampaignsUri)
      .then((response) => {
        const botResponse = {
          mrkdwn: true,
          text: `Gambit Campaigns running on *${environmentName.toUpperCase()}*:`,
          attachments: [],
        };

        response.body.data.forEach((campaign, index) => {
          const campaignUri = `${phoenixBaseUri(environmentName)}node/${campaign.id}`;
          const keywords = campaign.keywords.map(entry => entry.keyword);

          botResponse.attachments.push({
            callback_id: `${environmentName}_${campaign.id}`,
            color: hexForIndex(index),
            title: campaignTitleWithId(campaign),
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

/**
 * Fetches rendered Gambit campaign messages for the given campaignId and environmentName and
 * renders them as attachments of an outgoing Slack message.
 *
 * @param {number} campaignId - The numeric Phoenix Campaign ID.
 * @param {string} environmentName - Pass 'thor' to return Thor URI, else returns prod URI.
 * @return {Promise}
 */
module.exports.fetchRenderedCampaignMessages = function (campaignId, environmentName) {
  logger.info(`fetchRenderedCampaignMessages:${campaignId} ${environmentName}`);

  return new Promise((resolve, reject) => {
    const gambitCampaignUri = `${gambitApiBaseUri(environmentName)}campaigns/${campaignId}`;

    return request.get(gambitCampaignUri)
      .then((response) => {
        const campaign = response.body.data;
        let text = `Here's *${campaignTitleWithId(campaign)}* on ${environmentName}.`;
        text = `${text}\n\nYou can view the raw copy here, as JSON: ${gambitCampaignUri}`;
        const botResponse = {
          text,
          attachments: [],
        };
        if (!campaign.messages) {
          botResponse.text = `${botResponse.text} Error: response.body.messages undefined`;
          return resolve(botResponse);
        }

        const fieldNames = Object.keys(campaign.messages);
        fieldNames.forEach((fieldName, index) => {
          const attachment = {
            color: hexForIndex(index),
          };
          attachment.title = fieldName;
          if (campaign.messages[fieldName].override === true) {
            attachment.title = `${attachment.title}**`;
            attachment.footer = `**Overridden in Contentful on Campaign ${campaign.id}`;
            attachment.footer_icon = doSomethingIconUri;
          }
          attachment.text = campaign.messages[fieldName].rendered;
          if (!attachment.text) {
            attachment.text = 'N/A';
          }
          botResponse.attachments.push(attachment);
        });

        return resolve(botResponse);
      })
      .catch(err => reject(err));
  });
};
