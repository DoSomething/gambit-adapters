'use strict';

module.exports = {
  clientOptions: {
    auth: {
      name: process.env.DS_GAMBIT_ADMIN_BASIC_AUTH_NAME,
      pass: process.env.DS_GAMBIT_ADMIN_BASIC_AUTH_PASS,
    },
    baseUri: process.env.DS_GAMBIT_ADMIN_BASEURI || 'https://gambit-admin-staging.herokuapp.com',
  },
};
