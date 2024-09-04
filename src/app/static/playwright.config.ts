import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import {devices} from "@playwright/test";

// Dotenv reads from default ".env" file.
dotenv.config();

export const baseURL =  process.env.baseURL ? process.env.baseURL : 'http://localhost:8080'

const config: PlaywrightTestConfig = {
    testDir: './src/tests/e2e',
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                baseURL,
                trace: 'on-first-retry',
                // For debugging on CI
                //trace: 'retain-on-failure',
            }
        },
    ],
    timeout: 30000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 5000,
    },
    fullyParallel: true,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
};

export default config;
