var config = require('./jest.config');

config.testRegex = "(/__tests__/.*|(\\.|/)(itest))\\.[jt]sx?$";
config.globals = {...config.globals, "appUrl": "http://localhost:8080/"};
module.exports = config;
