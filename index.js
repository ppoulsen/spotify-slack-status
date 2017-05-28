const setupConfig = require('./src/setup-config');

setupConfig()
  .then(config => console.log(JSON.stringify(config, null, 2)))
  .catch(error => console.error(error));
