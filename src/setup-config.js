/**
 * Functions to get/initialize config and update Spotify access tokens after
 * refresh.
 * @module set-status-to-current-track
 */
const fs = require('fs');
const path = require('path');
const prompt = require('prompt');
const open = require('open');
const SpotifyWebApi = require('spotify-web-api-node');

// Path to config file
const configPath = path.resolve(__dirname, '..', 'config.json');

// Spotify API Scope(s)
const spotifyScopes = ['user-read-playback-state'];

// Initial schema for prompt
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

// Follow-up schema for Spotify Access code after browser has been opened and
// permissions granted
const accessCodeSchema = {
  properties: {
    accessCode: {
      description: 'Provide Spotify access code after giving permissions in browser',
      required: true,
    },
  },
};

/**
 * @function getExistingConfig - Retrieves the existing config file. This is a
 *                               helper for the getConfig function, hence the
 *                               awkward passing-in of resolve and reject.
 *
 * @param  resolve getConfig resolve
 * @param  reject  getConig reject
 */
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

/**
 * @function createNewConfig - Creates new config file. This is a helper for
 *                             the getConfig function, hence the awkward
 *                             passing-in of resolve and reject.
 *
 * @param  {type} resolve getConfig resolve
 * @param  {type} reject  getConfig reject
 * @param  {type} fd      Config file descriptor
 */
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
      redirectUri: 'https://codepen.io/ppoulsen/pen/OmYRRz',
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

/**
 * @function getConfig - This gets the existing config if present or else
 *                       prompts the user to create a new config.
 *
 * @return Promise which resolves with config object
 */
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

/**
 * @function updateSpotifyAccessToken - Updates the Spotify access token in the
 *                                      config file.
 *
 * @param  newAccessToken New Spotify access token after refresh
 * @return                Promise that resolves with the new config object
 */
function updateSpotifyAccessToken(newAccessToken) {
  return new Promise((resolve, reject) => {
    getConfig()
      .then(config => {
        config.spotify = config.spotify || {};
        config.spotify.accessToken = newAccessToken;

        const configJson = JSON.stringify(config, null, 2);
        // Write config
        fs.writeFile(configPath, configJson, err => {
          if (err) {
            reject(err);
            return;
          }

          // Resolve with new config object
          resolve(config);
        });
      })
  });
}

module.exports = {
  getConfig,
  updateSpotifyAccessToken,
};
