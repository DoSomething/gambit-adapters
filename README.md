# Gambit Slack

Gambit Slack is a Slack app built with [Bolt for JavaScript](https://api.slack.com/tools/bolt) and used internally by DoSomething.org staff, for testing our [SMS flows](https://github.com/dosomething/gambit) by direct messaging a Slack bot user.


<img width="700" src="https://user-images.githubusercontent.com/1236811/106520323-77549700-6491-11eb-80f0-8a8c80a1d249.png" alt="DM conversation with Gambit Slack bot user" />

## Overview

When a staff member directly messages the Gambit Slack app's bot user, the bot user responds with the relevant [Gambit reply](https://github.com/dosomething/gambit), via the following API requests:

* Query the Slack API to find the email of the staff member who sent the DM to the bot user.

* Query the [Northstar API](https://github.com/DoSomething/northstar/blob/master/documentation/endpoints/users.md#retrieve-a-user) to find the Northstar user ID associated with the email address

* Post the staff member's user ID and the DM text to the [Gambit API](https://github.com/DoSomething/gambit/blob/main/documentation/endpoints/messages.md#custom) to determine the reply to send to the staff member

* Post the Gambit reply to the Slack API to send a DM back to the staff member from the bot user.

Staff members may test over both SMS and Slack -- Gambit maintains a separate conversation topic for each platform.

## Usage

Send a direct message to the `@gambit-staging` bot user to create or continue a Gambit conversation, and execute relevant requests to our QA Northstar instance to update your user (e.g. `sms_status`, `last_messaged_at`, voting plan fields) and/or create new campaign activity.

There are two Slack-specific differences to note:

### Testing Broadcasts

Staff can test a specific broadcast over Slack by sending the bot user a `broadcast {broadcastId}` command, e.g. `broadcast 62TUEOJJXwMXTs6IQMGXaG`

<img src="https://user-images.githubusercontent.com/1236811/106530558-6b70d100-64a1-11eb-9381-02ac4a2a3a8d.png" width="700" alt="Sending a broadcast command to the Slack bot user" />

### Photo Posts

If reporting back in a photo post topic, use the command `photo` in order to successfully send a photo when prompted. This app does not support using Slack file attachments to create a photo post (if we wanted to do that, it'd be best to move this code into Gambit itself vs. building support to send a raw file to the Gambit `POST /messages` API)

<img src="https://user-images.githubusercontent.com/1236811/106530741-be4a8880-64a1-11eb-9db8-2f31d567fd57.png" width="700" alt="Sending a photo command to the Slack bot user" />

## Details

This app requires a Slack app to be configured with the following settings:

### Permissions

The Gambit Slack app requires permissions to view a Slack user's email address, as well as the ability to read and create messages in Slack channels.

### Event Subscriptions

The Gambit Slack app requires that Event Subscriptions enabled and subscribed to direct message events.

<img width="500" src="https://user-images.githubusercontent.com/1236811/106339720-47688200-624c-11eb-845c-54772af8dbe3.png" alt="Screenshot of Event Subscriptions configuration for Slack app"/>

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
