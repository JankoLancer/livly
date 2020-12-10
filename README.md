
# Livly - Open-source Slack leave management

**🌱 Livly is the first free open-source friendly leave management tool for your company. 🌱**

You can request for vacation, sick, and other types of leave, and only a chosen approver can approve/deny requests. Whenever a new request is created, approver get notification in their personal chats. After each approved/denied leave request, the user gets a notification.

Livly offers daily notifications about who's on leave that day. You don't need to remember it, Livly will remember for you.
Also, Livly provides a clear overview Home page, where you can observe the most important data about your team's leaves.
This enables simple, fast, reliable, and transparent leave management within your team.

**ToDo :**
- [ ] Web portal for company preferences (daily notification time, leave types, approvers, etc.)
and leave management (list all leaves, CRUD leaves, leave reports)
- [ ] Google Calendar, Outlook, iCloud Calendar sync
- [ ] See how many days off the user have remaining
- [ ] Approver can leave a comment when approving leave(s)

**Contribute:**

You can help make Livly the best Slack Leave Managament tool. Feel free to report bugs, improvement ideas or start working on some from ToDo list. **Contact us** if you want to help and work together with us!

![Slack leave request flow](https://github.com/JankoLancer/livly/blob/main/images/flow.gif)

## API & Features

This app uses:
- Event subscriptions
    - `app_home_opened` Receive event when user open Livly home page. This allow us to refresh content on home page and show user newest information. 
    - `channel_left` Receive event when app is kicked from channel. Thins allow us to know that bot cannot post new messages on that channel from that moment.
    - `app_uninstalled` Receive event when app is deleted from workspace. This allow us to delete token for that workspace.
    
 - Bot Token Scopes
    - `channels:join` to join publich channel so Livly can post leaves notifications
    - `channels:read` to show all channels that Livly can join
    - `chat:write` to send notifications about new leaves in public channel
    - `im:history` to view messages and other content in direct messages that livly has been added to 
    - `im:write` to send messages to private chat with users 
    - `team:read` to read basic information about workspace
    - `users:read` to view users in workspace
- Block Kit messages with interactive buttons
- Block Kit Modals API with dynamic menus

## Setup enviroment	
If you want to contribute, you can setup enviroment in the following way. This requires to create your own Slack app so you can test your changes.

### 1. Clone this repo, or Remix this Glitch repo

Clone the repo (then `npm install` to install the dependencies), or if you'd like to work on Glitch, remix from the button below:

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/remix/cumbersome-rowan-henley)

#### 2. Create a Slack app

1. Create an app at [api.slack.com/apps](https://api.slack.com/apps)
2. Navigate to the OAuth & Permissions page and add the following Bot token scopes:
    - `channels:join`
    - `channels:read`
    - `chat:write`
    - `im:history`
    - `im:write`
    - `team:read`
    - `users:read`
3. Enable the events (See below *Enable the Events API*)
4. Enable the interactive messages (See below *Enable Interactive Messages*)
5. Enable App Home (See below *App Home*)
6. Click 'Save Changes' and install the app (You should get an OAuth access token after the installation

#### Enable the Events API
1. Click on **Events Subscriptions** and enable events.
2. Set the Request URL to your server (or Glitch URL) + `/events` (*e.g.* `https://your-server.com/events`)
3. On the same page, go down to **Subscribe to Bot Events** section and subscribe to these events 
    - `app_home_opened`
    - `channel_left`
    - `app_uninstalled`
4. Save

#### Add Redirect URLs
1. Click on **OAuth & Permissions**
2. Click on **Add new Redirect URL**
3. Set the Request URL to your server (or Glitch URL) + `/auth` (*e.g.* `https://your-server.com/auth`) 
4. Save

#### Enable Interactive Messages

To enable interactive UI components (This example uses buttons):

1. Click on **Interactive Components** and enable the interactivity.
2. Set the Request URL to your server (or Glitch URL) + `/interactions`

To dynamically populate a drop-down menu list in a dialog (This example uses a list of channels):

1. Insert the Options Load URL (*e.g.* `https://your-server.com/options`) in the **Message Menus** section
2. Save

#### Enable App Home

To enable App Home:

1. Click on **App Home** and make sure both `Home Tab` and `Messages Tab` are enabled.

#### 3. Run this App
Set Environment Variables and run:

1. Set the following environment variables in `.env` (copy from `.env.sample`):
    * `SLACK_CLIENT_ID`: Your app’s Client ID (available on the **Basic Information** page)
    * `SLACK_CLIENT_SECRET`: Your app's Client Secret (available on the **Basic Information** page)
2. If you're running the app locally:
    * Start the app (`npm start`)
3. Install app from App Directory Page