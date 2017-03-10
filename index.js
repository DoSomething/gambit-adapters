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
  let output = 'Campaigns running on Gambit production:\n';
  request.get(`${gambitBaseUri}campaigns`)
    .then((response) => {
      response.body.data.forEach((campaign) => {
        output = `${output} - ${campaign.title}\n`
      })
      bot.reply(message, output);
    })
});
