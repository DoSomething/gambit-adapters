# Slothbot
Slothbot is an internal DoSomething.org Slack app used for tasks like returning [Gambit API](http://github.com/dosomething/gambit) queries. Slothbot is built with [Botkit](https://github.com/howdyai/botkit).

The Slothbot is named in honor of the DoSomething Puppet Sloth, who would like to remind you from the grave that he once [interviewed Tyler Oakley](https://youtu.be/wetvnbDB4wg).

Commands for mentioning `@slothbot`:

* `help` -- introduction, list direct messages commands

Commands for direct messages to `@slothbot`:

* `keywords` -- returns all production Gambit campaigns and keywords 
* `thor` -- returns all Thor Gambit campaigns and keywords

## Development

DoSomething staffers interact with the Slack app (and bot) called Slothbot, which runs on Heroku.

There's a second Slack app, Slothbot Dev, used for developers to work on Slothbot locally.

### Getting Started

Install Node, ngrok, and the Heroku toolbelt. 

Next, clone this repository and create a `.env` file with the [Client ID, Client Secret](https://api.slack.com/apps/A4HJDDLUQ/general), and [Bot User Access Token](https://api.slack.com/apps/A4HJDDLUQ/oauth) for our "Slothbot Dev" Slack app. 

To run Slothbot locally, execute `heroku local` from your Slothbot directory. The `@slothbot-dev` Slack bot user should appear online. Messages received by the `@slothbot-dev` bot will be sent to your local Slothbot instance.

### Interactive Messages

To test interactive messages, you'll need to run ngrok on your localhost: `ngrok http 5000`.

Update the [Slothbot Dev Interactive Messages URL](https://api.slack.com/apps/A4HJDDLUQ/interactive-messages) with the URL returned by ngrok. but keeping the Botkit-defined `/slack/receieve` path, e.g. https://36ed0448.ngrok.io/slack/receive.

<img src="https://cloud.githubusercontent.com/assets/1236811/24002302/9e8ebd0a-0a1d-11e7-9e14-4b9b91ce3d20.png" width="600">

Interactive Messages callbacks (e.g. clicking on a View Messages button in the list of Campaigns) will now be sent to your localhost.
