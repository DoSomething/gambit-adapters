'use strict';

const Slack = require('@slack/client');
const Cacheman = require('cacheman');
const logger = require('heroku-logger');

const gambitCampaigns = require('../../lib/gambit/campaigns');
const gambitConversations = require('../../lib/gambit/conversations');
const northstar = require('../../lib/northstar');
const slack = require('../../lib/slack');

// TODO: Move env variables to config.
const apiToken = process.env.SLACK_API_TOKEN;
const rtm = new Slack.RtmClient(apiToken);
const web = new Slack.WebClient(apiToken);
const ttl = process.env.CACHE_TTL || 1440;
const cache = new Cacheman({ ttl });
const platform = 'gambit-slack';

rtm.start();

rtm.on(Slack.CLIENT_EVENTS.RTM.AUTHENTICATED, (response) => {
  const bot = response.self.name;
  const team = response.team.name;
  logger.info('Slack authenticated.', { bot, team });
});

function fetchNorthstarUserForSlackUserId(slackUserId) {
  if (!slackUserId) {
    return Promise.resolve();
  }

  return cache.get(slackUserId)
    .then((user) => {
      if (user) {
        logger.debug('cache hit', { slackUserId });
        return user;
      }
      logger.debug('cache miss', { slackUserId });
      return web.users.info(slackUserId)
        .then(slackRes => northstar.fetchUserByEmail(slackRes.user.profile.email))
        .then(northstarUser => cache.set(slackUserId, northstarUser))
        .then(cachedUser => cachedUser);
    });
}

/**
 * Posts Campaign List Message to given Slack channel for given environmentName.
 * @param {object} channel
 * @param {string} environmentName
 * @return {Promise}
 */
function postCampaignIndexMessage(channel, environmentName) {
  rtm.sendTyping(channel);

  return gambitCampaigns.index(environmentName)
    .then((response) => {
      const text = `Gambit ${environmentName.toUpperCase()} campaigns:`;
      const attachments = response.body.data.map((campaign, index) => {
        const attachment = slack.parseCampaignAsAttachment(environmentName, campaign, index);
        return attachment;
      });

      return web.chat.postMessage(channel, text, { attachments });
    })
    .then(() => logger.debug('postCampaignIndexMessage', { channel, environmentName }))
    .catch((err) => {
      const message = err.message;
      rtm.sendMessage(message, channel);
      logger.error('postCampaignIndexMessage', err);
    });
}

/**
 * @param {string} channelId
 * @param {string} slackUserId
 * @param {string} campaignId
 */
module.exports.postSignupMessage = function (channelId, slackUserId, campaignId) {
  const payload = {
    campaignId,
    platform,
  };

  return fetchNorthstarUserForSlackUserId(slackUserId)
    .then((user) => {
      payload.northstarId = user.id;
      return gambitConversations.postSignupMessage(payload);
    })
    .then((gambitRes) => {
      const data = gambitRes.body.data;
      logger.debug('gambitConversations.postSignupMessage', { data });
      return rtm.sendMessage(data.messages[0].text, channelId);
    })
    .catch(err => rtm.sendMessage(err.message, channelId));
};

/**
 * Handle message events.
 */
rtm.on(Slack.RTM_EVENTS.MESSAGE, (message) => {
  // Only respond to private messages.
  if (message.channel[0] !== 'D') return null;

  // Don't reply to our sent messages.
  if (message.reply_to || message.bot_id || message.subtype === 'bot_message') {
    return null;
  }

  logger.debug('slack message received', message);
  const channel = message.channel;
  let command;
  if (message.text) {
    command = message.text.toLowerCase().trim();
  }

  if (command === 'keywords') {
    return postCampaignIndexMessage(channel, 'production');
  }

  if (command === 'thor' || command === 'staging') {
    return postCampaignIndexMessage(channel, 'thor');
  }

  let mediaUrl = null;
  // Hack to upload images (when an image is shared over DM, it's private in Slack).
  if (command === 'photo') {
    // TODO: Allow pasting image URL.
    mediaUrl = 'http://cdn1us.denofgeek.com/sites/denofgeekus/files/dirt-dave-and-gill.jpg';
  }

  const payload = {
    messageId: message.ts,
    text: message.text,
    mediaUrl,
  };

  return fetchNorthstarUserForSlackUserId(message.user)
    .then((northstarUser) => {
      payload.northstarId = northstarUser.id;
      return gambitConversations.postSlackMessage(payload);
    })
    .then((gambitRes) => {
      const reply = gambitRes.body.data.messages.outbound[0];
      if (!reply.text) {
        return true;
      }
      return rtm.sendMessage(reply.text, channel);
    })
    .catch(err => rtm.sendMessage(err.message, channel));
});
