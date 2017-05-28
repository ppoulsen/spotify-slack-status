const SpotifyWebApi = require('spotify-web-api-node');
const request = require('request');
const { updateSpotifyAccessToken } = require('./setup-config');

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
        reject();
      } else {
        resolve();
      }
    });
  });
}

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

function setSlackStatusToCurrentTrack(config) {
  return getCurrentSpotifyTrack(config.spotify)
    .then(response => {
      console.log(JSON.stringify(response.body.item.name, null, 2));
    });
}

module.exports = setSlackStatusToCurrentTrack;
