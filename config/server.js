module.exports = {
  bolt: {
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  },
  port: process.env.PORT || 3000,
};
