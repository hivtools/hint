import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {baseURL} from "../../../../playwright.config";

export * from '@playwright/test';
export const test = baseTest.extend<{}, { workerStorageState: string }>({
    // Use the same storage state for all tests in this worker.
    storageState: ({ workerStorageState }, use) => use(workerStorageState),

    // Authenticate once per worker with a worker-scoped fixture.
    workerStorageState: [async ({ browser }, use) => {
        // Use parallelIndex as a unique identifier for each worker.
        const id = test.info().parallelIndex;
        const fileName = path.resolve(`.playwright-auth/${id}.json`);

        if (fs.existsSync(fileName)) {
            // Reuse existing authentication state if any.
            await use(fileName);
            return;
        }

        // Important: make sure we authenticate in a clean environment by unsetting storage state.
        const page = await browser.newPage({ storageState: undefined });

        // Perform authentication steps.
        await page.goto(baseURL);
        await page.getByPlaceholder('Email').fill('test.user@example.com');
        await page.getByPlaceholder('Password').fill('password');
        await page.getByText('Log In').click();

        // Wait for login to complete.
        await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

        // Save storage state.
        await page.context().storageState({ path: fileName });
        await page.close();
        await use(fileName);
    }, { scope: 'worker' }],
});
