import {test, expect, Page} from '@playwright/test';

test.describe("data exploration test", () => {

    test('can redirect to exploration page', async ({page}) => {
        await page.goto('/explore');
        await expect(page).toHaveTitle("Naomi Data Exploration");
        await expect(page.locator("#loading-message")).toHaveText("Loading your data")
        await expect(page.locator('a[href="/logout"]')).toHaveCount(1)

        await page.waitForSelector("#data-exploration")
        await expect(page.locator("#data-exploration .has-tooltip")).toHaveText("Get access key from ADR");
    });
})
