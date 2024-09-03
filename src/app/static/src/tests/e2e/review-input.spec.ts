import {expect, test} from "./fixtures/project-page";
import {uploadAllTestFiles} from "./utils/upload-utils";
import {buildWaitForUpdateCallback} from "./utils/utils";

test("can view time series plot", async ({ projectPage }) => {
    const page = projectPage.page;
    await projectPage.createProject();

    // When I upload all files
    await uploadAllTestFiles(page);

    // Continue button is active
    const continueButton = page.locator("#continue").nth(0);
    await expect(continueButton).not.toBeDisabled();

    // When I click continue
    await continueButton.click();

    // Review inputs page matches screenshot after data fetched
    await expect(page.locator("#review-loading")).toHaveCount(0);
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-landing.png");
    const waitForPlotUpdate = await buildWaitForUpdateCallback(page.locator(".plot-container.plotly"), 100, 20);

    // and we're on first page
    await expect(page.locator("#page-number")).toHaveText("Page 1 of 3");
    await expect(page.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next page" })).not.toBeDisabled();

    // When I click to open next page
    await page.getByRole("button", { name: "Next page" }).click();

    // We're on page 2
    await expect(page.locator("#page-number")).toHaveText("Page 2 of 3");
    await expect(page.getByRole("button", { name: "Previous page" })).not.toBeDisabled();
    await expect(page.getByRole("button", { name: "Next page" })).not.toBeDisabled();

    // Plot has updated
    await waitForPlotUpdate();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-page2.png");

    // When I click to open next page
    await page.getByRole("button", { name: "Next page" }).click();

    // Paging is updated
    await expect(page.locator("#page-number")).toHaveText("Page 3 of 3");
    await expect(page.getByRole("button", { name: "Previous page" })).not.toBeDisabled();
    await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();

    // When I change area level to region
    await page.getByRole("button", { name: "District + Metro" }).click();
    await page.locator("a").filter({ hasText: "Region" }).click();

    // Plot has updated
    await waitForPlotUpdate();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-region.png");

    // Paging is hidden
    await expect(page.locator("#page-number")).toHaveCount(0);

    // When I change data source
    await page.getByRole("button", { name: "ART", exact: true }).click();
    await page.locator("a").filter({ hasText: "ANC testing" }).click();

    // Plot has updated
    await waitForPlotUpdate();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-anc.png");
});
