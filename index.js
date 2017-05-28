const { getConfig } = require('./src/setup-config');
const setSlackStatusToCurrentTrack = require('./src/set-status-to-current-track');

let stopProgram = false;
let timeoutId = null;
let timeoutResolve = null;

process.on('SIGINT', () => {
  stopProgram = true;
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  if (timeoutResolve) {
    timeoutResolve();
  }
});

function setStatusIfStillRunning(config) {
  if (stopProgram) {
    return;
  }

  return new Promise((resolve, reject) => {
    timeoutResolve = resolve;
    setSlackStatusToCurrentTrack(config)
      .then(() => {
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

getConfig()
  .then(setStatusIfStillRunning)
  .catch(error => console.error(error));
