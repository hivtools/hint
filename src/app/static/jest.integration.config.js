var config = require('./jest.config');

config.testRegex = "(/__tests__/.*|(\\.|/)(itest))\\.[jt]sx?$";
//config.testPathIgnorePatterns=['/__tests__/.*adr']
config.globals = {...config.globals, "appUrl": "http://localhost:8080/"};
config.coverageDirectory = "./coverage/integration/";
config.testTimeout = 6000;
module.exports = config;
