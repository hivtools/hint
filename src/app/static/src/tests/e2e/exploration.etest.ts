import {test, expect, Page} from '@playwright/test';

test.describe("data exploration test", () => {

    test('can redirect to exploration page', async ({page}) => {
        await page.goto('/explore');
        await expect(page).toHaveTitle("Naomi Data Exploration");
        await expect(page.locator('a[href="/logout"]')).toHaveCount(1)
        await page.waitForSelector("#data-exploration")
        await expect(page.locator("#data-exploration .v-popper--has-tooltip")).toHaveText("Get access key from ADR");
    });
})
