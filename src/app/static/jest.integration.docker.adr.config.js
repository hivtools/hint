var config = require('./jest.integration.docker.config');

config.testTimeout = 90000;
module.exports = config;
