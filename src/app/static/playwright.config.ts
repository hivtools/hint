import type { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import {devices} from "@playwright/test";

// Dotenv reads from default ".env" file.
dotenv.config({quiet: true});

export const baseURL =  process.env.baseURL ? process.env.baseURL : 'http://localhost:8080'

const config: PlaywrightTestConfig = {
    testDir: './src/tests/e2e',
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                baseURL,
                // Keep the trace of a failed attempt, including the first. With 'on-first-retry' only the retry has a trace,
                // so when a test fails and then passes (or fails differently) the first failure cannot be looked at
                trace: 'retain-on-failure',
            }
        },
    ],
    timeout: 70_000,
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
    // In CI, schedule and shard single tests, not whole files, so that the
    // tests of a slow file can run at the same time on different workers.
    // The tests in a file do not depend on each other: each test makes its
    // own project. Local runs stay as before: one worker for each file.
    fullyParallel: !!process.env.CI,
    // In CI, each shard writes a blob report. The workflow merges the blob
    // reports of all shards into one HTML report. "dot" keeps the progress in
    // the job log. Local runs keep the Playwright default, "list".
    reporter: process.env.CI ? [["dot"], ["blob"]] : "list",
    retries: process.env.CI ? 1 : 0,
    // Two workers share one app stack in each CI job. More workers can make
    // the tests time out.
    workers: process.env.CI ? 2 : undefined,
};

export default config;
