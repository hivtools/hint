var config = require('./jest.config');

config.setupFiles = ["./src/tests/setup.ts"];
config.testRegex = "(/__tests__/.*|(\\.|/)(itest))\\.[jt]sx?$";
config.globals = {...config.globals, "appUrl": "http://localhost:8080/"};
config.coverageDirectory = "./coverage/integration/";
module.exports = config;
