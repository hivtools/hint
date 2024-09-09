import {expect, Page} from "@playwright/test";

export async function setValidModelOptions(page: Page) {
    // Note this will work for Malawi with the mock model only
    await page.locator("div")
        .filter({ hasText: /^Area level \(required\)Select\.\.\.Select\.\.\.$/ })
        .getByRole("textbox").click();
    await page.getByText("District + Metro").click();
    await page.getByRole("button", { name: "Validate" }).click();
    await expect(page.getByText("Options are valid")).toBeVisible();
}
