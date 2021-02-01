# Gambit Slack

Gambit Slack is a Slack app used internally by DoSomething.org staff, for testing our [SMS flows](https://github.com/dosomething/gambit-conversations) by direct messaging a Slack bot user.

Gambit Slack built with [Bolt for JavaScript](https://api.slack.com/tools/bolt).


## Overview

When a staff member directly messages the Gambit Slack app's bot user, the bot user will respond with relevant Gambit reply based on the Gambit conversation topic.

When Gambit Slack app receives a direct message event from a staff member, it will:

* Query the Slack API to find the email of the staff member who sent the DM to the bot.

* Query the Northstar API to find the Northstar user ID associated with the email address

* Post the DM text and Northstar user to the Gambit API to retrieve the reply to send to the user

* Post the Gambit reply to the Slack API to send a DM back to the staff member.

Staff members may test over both SMS and Slack -- Gambit maintains a separate conversation topic for each platform.


### License

DoSomething.org. Gambit Slack is free software, and may be redistributed under the terms specified in the [LICENSE](https://github.com/DoSomething/gambit-slack/blob/master/LICENSE) file. The name and logo for DoSomething.org are trademarks of Do Something, Inc and may not be used without permission.
