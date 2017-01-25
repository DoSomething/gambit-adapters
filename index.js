var Botkit = require('botkit');

const controller = Botkit.slackbot();
const bot = controller.spawn({
  token: process.env.SLACK_API_TOKEN,
});

bot.startRTM((err, bot, payload) => {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.hears('puppet', ['mention', 'ambient'], (bot,message) => {
  bot.reply(message, 'Puppet!');
});

controller.hears('eye', ['mention', 'ambient'], (bot, message) => {
  bot.reply(message, 'Somebody, please... fix my eye.');
});
