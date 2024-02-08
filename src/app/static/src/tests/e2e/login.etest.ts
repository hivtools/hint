import {test, expect, Page} from '@playwright/test';

test.describe("data exploration test", () => {

    test('can redirect to exploration page', async ({page}) => {
        await page.goto('/');
        await expect(page).toHaveTitle("Naomi");
        await expect(page.locator('a[href="/logout"]')).toHaveCount(1)
        await page.waitForSelector("#projects-content")
        await expect(page.locator("#projects-content #projects-header")).toHaveText("Create a new project");
    });
})
