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
    testResultsProcessor: 'jest-teamcity-reporter',
    moduleFileExtensions: [
        'js',
        'json',
        'ts',
        'vue',
    ],
    transform: {
        '.*\\.(vue)$': 'vue-jest',
        '^.+\\.ts?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
                diagnostics: {
                    warnOnly: false,
                }
            }
        ],
        '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    },
    moduleNameMapper: {
        'd3-format': '<rootDir>/node_modules/d3-format/dist/d3-format.min.js',
        'd3-scale-chromatic': '<rootDir>/node_modules/d3-scale-chromatic/dist/d3-scale-chromatic.min.js',
        'd3-interpolate': '<rootDir>/node_modules/d3-interpolate/dist/d3-interpolate.min.js',
        'd3-color': '<rootDir>/node_modules/d3-color/dist/d3-color.min.js',

    },
    coverageDirectory: './coverage/',
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        '/node_modules/',
        './tests/mocks.ts',
        './tests/testHelpers.ts',
        './tests/.*/helpers.ts',
    ],
    preset: 'ts-jest/presets/js-with-babel',
}
