'use strict';

const request = require('superagent');

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
  const output = {
    username: 'Puppet Sloth',
    icon_url: 'https://pbs.twimg.com/profile_images/344513261577739462/0ffdff5acd5ff3bcd34c0cd10baf2a14.png',
    text: `Gambit Campaigns running on *${environmentName.toUpperCase()}*:`,
    mrkdwn: true,
    attachments: [],
  };

  const colors = ['FCD116', '23b7fb', '4e2b63'];

  return new Promise((resolve, reject) => {
    const gambitCampaignsUri = `${this.gambitApiBaseUri(environmentName)}campaigns`;

    return request.get(gambitCampaignsUri)
      .then((response) => {
        response.body.data.forEach((campaign, index) => {
          const campaignUri = `${this.phoenixBaseUri(environmentName)}node/${campaign.id}`;
          const keywords = campaign.keywords.map(entry => entry.keyword);

          output.attachments.push({
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

        return resolve(output);
      })
    .catch(err => reject(err));
  });
};
