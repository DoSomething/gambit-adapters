# Gambit Slack

Gambit Slack is a Slack app built with [Bolt for JavaScript](https://api.slack.com/tools/bolt) and used internally by DoSomething.org staff, for testing our [SMS flows](https://github.com/dosomething/gambit) by direct messaging a Slack bot user.


<img src="https://user-images.githubusercontent.com/1236811/106520323-77549700-6491-11eb-80f0-8a8c80a1d249.png" alt="DM conversation with Gambit Slack bot user" />

## Overview

When a staff member directly messages the Gambit Slack app's bot user, the bot user responds with the relevant [Gambit reply](https://github.com/dosomething/gambit), via the following API requests:

* Query the Slack API to find the email of the staff member who sent the DM to the bot user.

* Query the [Northstar API](https://github.com/DoSomething/northstar/blob/master/documentation/endpoints/users.md#retrieve-a-user) to find the Northstar user ID associated with the email address

* Post the staff member's user ID and the DM text to the [Gambit API](https://github.com/DoSomething/gambit/blob/main/documentation/endpoints/messages.md#custom) to determine the reply to send to the staff member

* Post the Gambit reply to the Slack API to send a DM back to the staff member from the bot user.

Staff members may test over both SMS and Slack -- Gambit maintains a separate conversation topic for each platform.

## Details

### Event Subscriptions

The Gambit Slack app has Event Subscriptions enabled, and subscribes to direct message events.

### Bot Users

The Gambit Slack app's bot user name is `@gambit-staging`, because it executes API requests against the Gambit Staging instance.


## Installation

There's a duplicate Slack app, "Gambit Dev", created with the same configurations as the Gambit Staging app, except its bot user is `@gambit-dev`, and its Event Subscriptions URL points to an ngrok URL.

This Slack app can be used for developing on your local machine. To run locally:

* Install Node.js and [ngrok](https://ngrok.com/). 

* Clone this repo and run `npm install`

* Create a `.env.` file and copy the relevant bot token and signing secret values from the [Gambit Dev Slack app](https://api.slack.com/apps/A6QPLKUE9), as well as the appropriate credentials for Northstar and Gambit.

* Run `npm start` to start the app. In a separate tab, run `ngrok http 3000` to create a URL to your localhost server.

* Edit the Gambit Dev Slack app's Event Subscriptions Request URL to update the `ngrok` subdomain with the one running on your local.

* Send a DM to the `@gambit-dev` bot user -- it should query your localhost and then send a Slack DM reply back.

### License

DoSomething.org. Gambit Slack is free software, and may be redistributed under the terms specified in the [LICENSE](https://github.com/DoSomething/gambit-slack/blob/master/LICENSE) file. The name and logo for DoSomething.org are trademarks of Do Something, Inc and may not be used without permission.
