
module.exports = {
    testEnvironment: "jsdom",
    setupFiles: [
        './src/tests/setup.ts',
        'jest-canvas-mock',
    ],
    testEnvironmentOptions: {
        url: 'http://localhost'
    },
    globals: {
        currentUser: 'some.user@example.com',
    },
    testMatch: [
        "**/tests/**/*.test.{j,t}s"
    ],
   testResultsProcessor: 'jest-teamcity-reporter',
    transformIgnorePatterns: [
        "/node_modules/(?!d3-format|d3-scale-chromatic|d3-interpolate|d3-color)/"
    ],
    moduleDirectories: ["node_modules", "src"],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        '/node_modules/',
        './tests/mocks.ts',
        './tests/testHelpers.ts',
        './tests/.*/helpers.ts',
    ],
    preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
    modulePaths: [
        "<rootDir>"
    ],
}
