/**
 * Function to set Slack status to current Spotify track.
 * @module set-status-to-current-track
 */

const SpotifyWebApi = require('spotify-web-api-node');
const request = require('request');
const { updateSpotifyAccessToken } = require('./setup-config');


/**
 * @function setSlackStatus - Sets Slack status for given access token
 *
 * @param  statusText  Slack status text (appears on hover and in DMs)
 * @param  statusEmoji Slack status emoji (appears next to name)
 *                     needs to be wrapped in colons like ":spotify:"
 * @param  accessToken Slack legacy API token for user
 * @return             Promise for network request
 */
function setSlackStatus(statusText, statusEmoji, accessToken) {
  return new Promise((resolve, reject) => {
    const profile = {
      'status_text': statusText,
      'status_emoji': statusEmoji,
    };
    const profileJson = JSON.stringify(profile);
    const encodedProfile = encodeURIComponent(profileJson);
    const baseUrl = 'https://slack.com/api/users.profile.set';
    const fullUrl = `${baseUrl}?token=${accessToken}&profile=${encodedProfile}`;
    request.post({
      url: fullUrl,
    }, (error, response, body) => {
      if (error || response.statusCode >= 400) {
        reject(error || new Error('Failed to set Slack status'));
      } else {
        resolve(statusText);
      }
    });
  });
}

/**
 * @function getCurrentSpotifyTrack - Refreshes Spotify Authorization token,
 *                                    updates the config file, and returns
 *                                    current player request
 *
 * @param    spotifyConfig Config object containing accessToken, clientId,
 *                         clientSecret, and refreshToken
 * @return                 Promise that resolves with current playback state
 *                         response
 */
function getCurrentSpotifyTrack(spotifyConfig) {
  const spotifyApi = new SpotifyWebApi({
    accessToken: spotifyConfig.accessToken,
    clientId: spotifyConfig.clientId,
    clientSecret: spotifyConfig.clientSecret,
    refreshToken: spotifyConfig.refreshToken,
  });

  return spotifyApi.refreshAccessToken()
    .then(data => {
      const accessToken = data.body['access_token'];

      return updateSpotifyAccessToken(accessToken)
        .then(() => {
          // Save the access token so that it's used in future calls
          spotifyApi.setAccessToken(accessToken);

          return spotifyApi.getMyCurrentPlaybackState();
        });
    });
}

/**
 * @function setSlackStatusToCurrentTrack - Sets Slack status to current track
 *
 * @param  config Configuration object for project
 * @return        description
 */
function setSlackStatusToCurrentTrack(config) {
  return getCurrentSpotifyTrack(config.spotify)
    .then(response => {
      const name = response.body.item.name;
      let artists = '';
      if (response.body.item.artists) {
        response.body.item.artists.forEach(artist => {
          if (artists.length) {
            artists += ', ';
          }

          artists += artist.name;
        });
      }

      let status;
      if (artists) {
        status = `${name} - ${artists}`;
      } else {
        status = `${name}`;
      }

      return setSlackStatus(status, ':spotify:', config.slack.legacyApiToken);
    });
}

module.exports = setSlackStatusToCurrentTrack;
