const fs = require('fs');
const prompt = require('prompt');
const open = require('open');
const SpotifyWebApi = require('spotify-web-api-node');

const configPath = './config.json';
const spotifyScopes = ['user-read-currently-playing'];
const initialSchema = {
  properties: {
    slackApiToken: {
      description: 'Provide legacy Slack API token from https://api.slack.com/custom-integrations/legacy-tokens:',
      required: true,
    },
    spotifyClientId: {
      description: 'Create Spotify app and provide client ID from https://developer.spotify.com/my-applications/:',
      required: true,
    },
    spotifyClientSecret: {
      description: 'Create Spotify app and provide client secret from https://developer.spotify.com/my-applications/:',
      required: true,
    },
  },
};
const accessCodeSchema = {
  properties: {
    accessCode: {
      description: 'Provide Spotify access code after giving permissions in browser',
      required: true,
    },
  },
};

function getExistingConfig(resolve, reject) {
  fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
      reject(err);
      return;
    }

    const config = JSON.parse(data);
    resolve(config);
  });
}

function createNewConfig(resolve, reject, fd) {
  // Initialize prompt
  prompt.colors = false;
  prompt.message = '';
  prompt.delimiter = '';

  prompt.start();

  // Get the Slack Legacy API Token and Spotify Client ID and Secret
  prompt.get(initialSchema, (err, result) => {
    const { spotifyClientId, spotifyClientSecret } = result;
    const spotifyApi = new SpotifyWebApi({
      // Codepen that writes the Access Code to document
      redirectUri: 'https://codepen.io/anon/pen/OmYRRz',
      clientId: spotifyClientId,
      clientSecret: spotifyClientSecret,
    });

    // Build an Authorize URL and open browser to it
    const authorizeUrl = spotifyApi.createAuthorizeURL(spotifyScopes, null);
    open(authorizeUrl);

    // Prompt the user for the Access Code
    prompt.get(accessCodeSchema, (err, accessCodeResult) => {
      // Use the access code to get an Access Token and Refresh Token
      spotifyApi.authorizationCodeGrant(accessCodeResult.accessCode)
        .then(data => {
          // Create config object
          const config = {
            slack: {
              legacyApiToken: result.slackApiToken,
            },
            spotify: {
              clientId: spotifyClientId,
              clientSecret: spotifyClientSecret,
              accessToken: data.body['access_token'],
              refreshToken: data.body['refresh_token'],
              accessTokenExpiresIn: data.body['expires_in'],
            },
          };

          // Stringify to write
          const configJson = JSON.stringify(config, null, 2);

          // Write config
          fs.write(fd, configJson, err => {
            if (err) {
              reject(err);
              return;
            }

            // Resolve with new config object
            resolve(config);
          });
        }, err => {
          reject(err);
        });
    });
  });
}

// This gets the existing config if present or else prompts the user to create
// a new config.
function getConfig() {
  return new Promise((resolve, reject) => {
    fs.open(configPath, 'wx', (err, fd) => {
      if (err) {
        getExistingConfig(resolve, reject);
        return;
      }

      createNewConfig(resolve, reject, fd);
    });
  });
}

module.exports = getConfig;
