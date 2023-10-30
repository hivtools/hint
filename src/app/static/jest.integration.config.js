var config = require('./jest.config');

config.testMatch = [
    "**/tests/**/*.itest.{j,t}s"
];
config.globals = {...config.globals, "appUrl": "http://localhost:8080/"};
config.coverageDirectory = "./coverage/integration/";
config.testTimeout = 6000;
config.setupFiles = [...config.setupFiles, "./src/tests/setup.integration.ts"];
module.exports = config;
