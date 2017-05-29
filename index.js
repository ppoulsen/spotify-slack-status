#!/usr/bin/env node

const { getConfig } = require('./src/setup-config');
const setSlackStatusToCurrentTrack = require('./src/set-status-to-current-track');

let stopProgram = false;
let timeoutId = null;
let timeoutResolve = null;

// Cancel timeouts and immediately resolve outstanding Promise
process.on('SIGINT', () => {
  stopProgram = true;
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  if (timeoutResolve) {
    timeoutResolve();
  }
});

/**
 * @function setStatusIfStillRunning - If app hasn't been stopped, continue
 *                                     updating Slack status every 30 seconds.
 *
 *
 * @param  config Full application config
 * @return        Promise that resolves with another Promise if app still running
 *                or else returns null.
 */
function setStatusIfStillRunning(config) {
  if (stopProgram) {
    return;
  }

  return new Promise((resolve, reject) => {
    timeoutResolve = resolve;
    setSlackStatusToCurrentTrack(config)
      .then(newStatus => {
        console.log(newStatus);
        if (stopProgram) {
          return;
        }

        timeoutId = setTimeout(() => {
          timeoutResolve = null;
          resolve(setStatusIfStillRunning(config));
        }, 30000);
      })
      .catch(error => reject(error));
  });
}

// Get config (initializing for first time setup)
getConfig()
  // Set status if still running
  .then(setStatusIfStillRunning)
  // Log error on exception and exit app
  .catch(error => console.error(error));
