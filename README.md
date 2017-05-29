# Current Spotify Track as Slack Status

A node (7.10.0) CLI tool to query player status from the Spotify Web API and set
the current track as Slack status using the legacy Slack token. The setup
instructions will guide you through setting up your own Spotify App and
authorizing it access your personal Spotify account's player information with
minimal overhead.

## Setup

1. Clone the repo with `git clone https://github.com/ppoulsen/spotify-slack-status.git`
2. Install dependencies with `yarn` or `npm install`
3. Run the app with `node index.js`

For the first run, you'll need to get your Slack legacy API token and set up
a Spotify developer account and app to get a Spotify Client ID and Secret. These
will be stored in a config.json at the top of the repo.

*Slack Legacy Token*
1. Go to https://api.slack.com/custom-integrations/legacy-tokens
2. Click "Create Token" next to the Slack Team/Account for which you would like
to set the status.
3. Copy the token into the appropriate command prompt.

*Spotify Authorization*
1. Go to https://developer.spotify.com/my-applications/
2. Set up a Spotify developer account if you have not already.
3. Create an App for the account.
4. Add the Redirect URI https://codepen.io/ppoulsen/pen/OmYRRz to get access code
after authorization and save changes.
5. Copy the Client ID and Client Secret into the appropriate command prompts.
6. Your default browser should open with the authorization URL. Login, accept,
and copy the access code from the codepen HTML body to the appropriate prompt.

From here on out, the app will attempt to refresh the access token and store the
new one with each call.

## License

MIT
