'use strict';

const Slack = require('@slack/client');
const Cacheman = require('cacheman');
const logger = require('heroku-logger');

const gambitCampaigns = require('../../lib/gambit/campaigns');
const gambitConversations = require('../../lib/gambit/conversations');
const helpers = require('../../lib/helpers');
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

function postErrorMessage(channelId, error) {
  let errorMessageText = error.message;
  if (error.response && error.response.body) {
    errorMessageText = error.response.body.message;
  }
  logger.error('postErrorMessage', { errorMessageText });
  rtm.sendMessage(errorMessageText, channelId);
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
 * @param {string} channelId
 * @param {string} slackUserId
 * @param {string} broadcastId
 */
module.exports.postBroadcastMessage = function (channelId, slackUserId, broadcastId) {
  const payload = {
    broadcastId,
    platform,
  };

  return fetchNorthstarUserForSlackUserId(slackUserId)
    .then((user) => {
      payload.northstarId = user.id;
      return gambitConversations.postBroadcastMessage(payload);
    })
    .then((gambitRes) => {
      const data = gambitRes.body.data;
      logger.debug('gambitConversations.postBroadcastMessage', { data });
      const message = data.messages[0];
      const attachments = message.attachments.map((attachment) => {
        const url = attachment.url;
        // Note: Assuming we're only sending images  in Broadcasts.
        return {
          image_url: url,
          fallback: url,
        };
      });
      return web.chat.postMessage(channelId, message.text, { attachments });
    })
    .catch(error => postErrorMessage(channelId, error));
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

  if (command === 'keywords') {
    return postCampaignIndexMessage(channel, 'production');
  }
  if (command === 'thor' || command === 'staging') {
    return postCampaignIndexMessage(channel, 'thor');
  }
  if (command === 'broadcast') {
    const broadcastId = message.broadcastId;
    if (!broadcastId) {
      const errorMsg = 'You need to pass a Broadcast Id. Example:\n\n> broadcast 5mPrrJjImQAGYi4goYWk2S`';
      return rtm.sendMessage(errorMsg, channel);
    }
    return module.exports.postBroadcastMessage(channel, slackUserId, broadcastId);
  }

  const payload = {
    messageId: message.ts,
    text: message.text,
    mediaUrl: message.mediaUrl,
  };

  return fetchNorthstarUserForSlackUserId(slackUserId)
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
