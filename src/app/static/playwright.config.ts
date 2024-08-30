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
                trace: 'retain-on-failure',
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
        toHaveScreenshot: {
            // There are sometimes differences between CI and local because of
            // a multiple of reasons I don't understand. Set a difference we accept.
            // We might want to switch to running these tests inside docker if this leads
            // to false positives.
            // See https://github.com/edumserrano/playwright-adventures/tree/main/demos%2Fdocker#description
            maxDiffPixelRatio: 0.02
        }
    },
    fullyParallel: true,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
};

export default config;
