'use strict';

const Promise = require('bluebird');
const Botkit = require('botkit');
const request = require('superagent');
const helpers = require('./lib/helpers');

const controller = Botkit.slackbot();
const slothbot = controller.spawn({ token: process.env.SLACK_API_TOKEN });

slothbot.startRTM((err) => {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

/**
 * Fetches Gambit campaigns on production, or for given environment.
 */
function fetchCampaigns(environmentName) {
  const output = {
    username: 'Puppet Sloth',
    text: `Gambit Campaigns running on *${environmentName.toUpperCase()}*:`,
    mrkdwn: true,
    attachments: [],
  };

  const colors = ['FCD116', '23b7fb', '4e2b63'];

  return new Promise((resolve, reject) => {
    const gambitCampaignsUri = `${helpers.gambitApiBaseUri(environmentName)}campaigns`;

    return request.get(gambitCampaignsUri)
      .then((response) => {
        response.body.data.forEach((campaign, index) => {
          const campaignUri = `${helpers.phoenixBaseUri(environmentName)}node/${campaign.id}`;
          const keywords = campaign.keywords.map(entry => entry.keyword);

          output.attachments.push({
            color: `#${colors[index % 3]}`,
            title: `${campaign.title} (ID ${campaign.id})`,
            title_link: campaignUri,
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
}

controller.hears('keywords', ['mention', 'direct_message'], (bot, message) => {
  fetchCampaigns('production')
    .then(response => bot.reply(message, response))
    .catch(err => bot.reply(message, err.message));
});

controller.hears('thor', ['mention', 'direct_message'], (bot, message) => {
  fetchCampaigns('thor')
    .then(response => bot.reply(message, response))
    .catch(err => bot.reply(message, err.message));
});
