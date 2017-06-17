/**
 * Module to setup keyboard commands if STDIN is a TTY
 * @module keyboard-events
 */

const readline = require('readline');

const {
  setSlackStatusToCurrentTrack,
  clearSlackStatus,
} = require('./slack-status');

function handleKeypressEvent(exit, config, str, key) {
  if (key.ctrl && key.name === 'c') {
    console.log('Exiting...'.message);
    exit();
    return;
  }

  switch (key.name) {
    case 'c':
    case 'q':
      if (key.ctrl || key.name === 'q') {
        console.log('Exiting...'.message);
        exit();
      }
      break;
    case 'd':
      console.log('Clearing Slack status...'.message);
      clearSlackStatus(config.slack.legacyApiToken);
      break;
    case 'f':
      console.log('Updating Slack status to current track...'.message)
      setSlackStatusToCurrentTrack(config)
        .then(newStatus => console.log(newStatus.song));
      break;
    default:
      console.log(`Unknown key pressed: ${key.name}`.message);
      break;
  }
}

function setupEventListeners(exit, config) {
  // Setup keyboard events
  if (!process.stdin.isTTY) return config;

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', handleKeypressEvent.bind(null, exit, config));
  return config;
}

module.exports = {
  setupEventListeners,
};
