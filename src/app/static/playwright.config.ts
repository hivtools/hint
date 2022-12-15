import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Dotenv reads from default ".env" file.
dotenv.config();

export const baseURL =  process.env.baseURL ? process.env.baseURL : 'http://localhost:8080'

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
        baseURL,
        trace: 'on-first-retry',
        /**
         *  StorageState.json stores signed-in state as configured in tests/e2e/loginSetup.ts.
         *  This ensures test suites can reuse the login state and not having to re-login
         *  for each test.
         *
         */
        storageState: 'storageState.json'
    }
};

export default config;
