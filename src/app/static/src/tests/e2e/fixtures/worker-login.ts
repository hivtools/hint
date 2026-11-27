import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {baseURL} from "../../../../playwright.config";

export * from '@playwright/test';
export const test = baseTest.extend<object, { workerStorageState: string }>({
    // Use the same storage state for all tests in this worker.
    storageState: ({ workerStorageState }, use) => use(workerStorageState),

    // Authenticate once per worker with a worker-scoped fixture.
    workerStorageState: [async ({ browser }, use) => {
        // Use parallelIndex as a unique identifier for each worker.
        const id = test.info().parallelIndex;
        const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

        if (fs.existsSync(fileName)) {
            // Reuse existing authentication state if any.
            await use(fileName);
            return;
        }

        // Important: make sure we authenticate in a clean environment by unsetting storage state.
        const page = await browser.newPage({ storageState: undefined });

        // Perform authentication steps: the dev login (HINT_DEV_USERS in docker-compose.yml), one button for each user
        await page.goto(baseURL);
        await page.getByRole('button', { name: 'Log in as test.user@example.com' }).click();

        // Wait for login to complete.
        await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

        // Save storage state.
        await page.context().storageState({ path: fileName });
        await page.close();
        await use(fileName);
    }, { scope: 'worker' }],
});
