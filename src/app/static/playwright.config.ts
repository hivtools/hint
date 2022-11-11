import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    globalSetup: require.resolve("./src/tests/e2e/loginSetup"),
    testMatch: '*.etest.ts',
    timeout: 30000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 5000
    },
    fullyParallel: true,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    use: {
        actionTimeout: 0,
        trace: 'on-first-retry',
        storageState: 'storageState.json'
    },
    projects: [
        {
            name: 'local',
            use: {
                baseURL: 'http://localhost:8080',
            }
        },
        {
            name: 'docker',
            use: {
                baseURL: 'http://hint:8080',
            }
        },
    ]
};

export default config;
