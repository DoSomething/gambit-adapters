# Gambit Slack

Gambit Slack is a Slack app used internally by DoSomething.org staff, for testing our [SMS flows](https://github.com/dosomething/gambit) by direct messaging a Slack bot user.

Gambit Slack built with [Bolt for JavaScript](https://api.slack.com/tools/bolt).

<img src="https://user-images.githubusercontent.com/1236811/106520323-77549700-6491-11eb-80f0-8a8c80a1d249.png" alt="DM conversation with Gambit Slack bot user" />

## Overview

When a staff member directly messages the Gambit Slack app's bot user, the bot user responds with the relevant [Gambit reply](https://github.com/dosomething/gambit), via the following API requests:

* Query the Slack API to find the email of the staff member who sent the DM to the bot.

* Query the [Northstar API](https://github.com/DoSomething/northstar/blob/master/documentation/endpoints/users.md#retrieve-a-user) to find the Northstar user ID associated with the email address

* Post the staff member's user ID and the DM text to the [Gambit API](https://github.com/DoSomething/gambit/blob/main/documentation/endpoints/messages.md#custom) to determine the reply to send to the staff member

* Post the Gambit reply to the Slack API to send a DM back to the staff member.

Staff members may test over both SMS and Slack -- Gambit maintains a separate conversation topic for each platform.


### License

DoSomething.org. Gambit Slack is free software, and may be redistributed under the terms specified in the [LICENSE](https://github.com/DoSomething/gambit-slack/blob/master/LICENSE) file. The name and logo for DoSomething.org are trademarks of Do Something, Inc and may not be used without permission.
