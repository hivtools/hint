var config = require('./jest.integration.config');
config.testURL = "http://hint:8080";
config.globals = {...config.globals, "appUrl": "http://hint:8080/"};
module.exports = config;
