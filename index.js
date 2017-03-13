'use strict';

const Botkit = require('botkit');

const controller = Botkit.slackbot();
const bot = controller.spawn({
  token: process.env.SLACK_API_TOKEN,
});

const request = require('superagent');
const gambitBaseUri = 'https://ds-mdata-responder.herokuapp.com/v1/'

bot.startRTM((err, bot, payload) => {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.hears('puppet', ['mention', 'ambient'], (bot, message) => {
  bot.reply(message, 'Puppet!');
});

controller.hears('eye', ['mention', 'ambient'], (bot, message) => {
  bot.reply(message, 'Somebody, please... fix my eye.');
});

controller.hears('keywords', ['mention', 'direct_message'], (bot, message) => {
  console.log('keywords');
  let output = {
    username: 'Puppet Sloth',
    text: 'Campaigns running on Gambit production:',
    attachments: [],
  };

  const colors = [ 'FCD116', '23b7fb', '4e2b63' ];

  request.get(`${gambitBaseUri}campaigns`)
    .then((response) => {
      response.body.data.forEach((campaign, index) => {
        const keywords = campaign.keywords.map(entry => entry.keyword);

        const attachment = {
          color: `#${colors[index % 3]}`,
          title: `${campaign.title} (ID ${campaign.id})`,
          title_link: `https://dosomething.org/node/${campaign.id}`,
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
        }
        output.attachments.push(attachment);
      });

      bot.reply(message, output);
    })
    .catch(err => console.log(err));
});
