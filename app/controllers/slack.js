'use strict';

const Slack = require('@slack/client');
const Cacheman = require('cacheman');
const logger = require('heroku-logger');

const gambit = require('../../lib/gambit');
const helpers = require('../../lib/helpers');
const northstar = require('../../lib/northstar');
const slack = require('../../lib/slack');

// TODO: Move env variables to config.
const apiToken = process.env.SLACK_API_TOKEN;
const rtm = new Slack.RtmClient(apiToken);
const web = new Slack.WebClient(apiToken);
const ttl = process.env.CACHE_TTL || 1440;
const cache = new Cacheman({ ttl });

rtm.start();

rtm.on(Slack.CLIENT_EVENTS.RTM.AUTHENTICATED, (response) => {
  logger.info('Slack authenticated.', { bot: response.self.name });
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
 * Sends message to channel where an error that has occurred.
 * @param {String} channel
 * @param {Error} error
 * @return {Promise}
 */
function postErrorMessage(channel, error) {
  logger.error('postErrorMessage', { error });
  const message = slack.getMessageFromError(error);
  return web.chat.postMessage(channel, message.text, { attachments: message.attachments });
}

/**
 * Posts list of campaigns that send web signup confirmations.
 * @param {String} channel
 * @return {Promise}
 */
function sendWebSignupList(channel) {
  rtm.sendTyping(channel);

  return gambit.get('campaigns')
    .then((gambitRes) => {
      const activeCampaigns = gambitRes.body.filter(campaign => campaign.status === 'active');
      const attachments = activeCampaigns.map((campaign, index) => slack
        .parseCampaignAsAttachment(campaign, index));
      return web.chat.postMessage(channel, 'Current campaigns', { attachments });
    })
    .catch(error => postErrorMessage(channel, error));
}

/**
 * @param {string} channel
 * @param {string} slackUserId
 * @param {string} campaignId
 */
module.exports.sendSignup = function (channel, slackUserId, campaignId) {
  return fetchNorthstarUserForSlackUserId(slackUserId)
    .then(user => gambit.postSignupMessage(user.id, campaignId))
    .then((gambitRes) => {
      const data = gambitRes.body.data;
      return rtm.sendMessage(data.messages[0].text, channel);
    })
    .catch(error => postErrorMessage(channel, error));
};

/**
 * @param {string} channel
 * @param {string} slackUserId
 * @param {string} broadcastId
 */
module.exports.sendBroadcast = function (channel, slackUserId, broadcastId) {
  return fetchNorthstarUserForSlackUserId(slackUserId)
    .then(user => gambit.postBroadcastMessage(user.id, broadcastId))
    .then((gambitRes) => {
      const data = gambitRes.body.data;
      const message = data.messages[0];
      const attachments = message.attachments.map((attachment) => {
        const url = attachment.url;
        // Note: Assuming we're only sending images  in Broadcasts.
        return {
          image_url: url,
          fallback: url,
        };
      });
      return web.chat.postMessage(channel, message.text, { attachments });
    })
    .catch(error => postErrorMessage(channel, error));
};

/**
 * Handle message events.
 */
rtm.on(Slack.RTM_EVENTS.MESSAGE, (message) => {
  if (!helpers.message.isDirectMessageFromUser(message)) {
    return null;
  }

  helpers.message.parseMessage(message);

  const channel = message.channel;
  const command = message.command;
  const slackUserId = message.user;

  if (command === 'web') {
    return sendWebSignupList(channel);
  }

  if (command === 'broadcast') {
    const broadcastId = message.broadcastId;
    if (!broadcastId) {
      const errorMsg = 'You need to pass a Broadcast Id. Example:\n\n> broadcast 2en018uiWcsMcIAWsGCQwS`';
      return rtm.sendMessage(errorMsg, channel);
    }
    return module.exports.sendBroadcast(channel, slackUserId, broadcastId);
  }

  return fetchNorthstarUserForSlackUserId(slackUserId)
    .then(user => gambit.postMemberMessage(user.id, message.text, message.mediaUrl))
    .then((gambitRes) => {
      const reply = gambitRes.body.data.messages.outbound[0];
      if (!reply.text) {
        return true;
      }
      return rtm.sendMessage(reply.text, channel);
    })
    .catch(error => postErrorMessage(channel, error));
});
