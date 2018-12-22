'use strict';

module.exports = {
  clientOptions: {
    auth: {
      name: process.env.DS_GAMBIT_CONVERSATIONS_BASIC_AUTH_NAME,
      pass: process.env.DS_GAMBIT_CONVERSATIONS_BASIC_AUTH_PASS,
    },
    baseUri: process.env.DS_GAMBIT_CONVERSATIONS_BASEURI || 'https://gambit-conversations-staging.herokuapp.com',
  },
};
