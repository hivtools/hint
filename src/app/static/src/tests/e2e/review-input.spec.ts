import {expect, test} from "./fixtures/project-page";
import {uploadAllTestFiles} from "./utils/upload-utils";
import {buildWaitForUpdateCallback, waitForAnimations} from "./utils/utils";

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
    await expect(page.locator("#review-loading")).toHaveCount(0, {timeout: 10000});
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

test("can view input map plot", async ({ projectPage }) => {
    const page = projectPage.page;
    await projectPage.createProject();

    // When I upload all files
    await uploadAllTestFiles(page);

    // Continue button is active
    const continueButton = page.locator("#continue").nth(0);
    await expect(continueButton).not.toBeDisabled();

    // When I click continue and open map plot
    await continueButton.click();
    await page.getByText("Map").click();

    // Map is rendered
    await expect(page.locator("#review-loading")).toHaveCount(0, {timeout: 10000});
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("input-map-landing.png");
    const waitForPlotUpdate = await buildWaitForUpdateCallback(page.locator(".leaflet-container"));

    // When I change indicator
    await page.getByRole("button", { name: "HIV prevalence" }).click();
    await page.locator("a").filter({ hasText: "Viral load suppression" }).click();

    // Updated map is rendered
    await expect(page.locator("#review-inputs")).toHaveScreenshot("input-map-vls.png");

    // When I change data source
    await page.getByRole("button", { name: "Household survey" }).click();

    // All data sources are shown
    await expect(page.locator("a").filter({ hasText: "Household survey" })).toBeVisible();
    await expect(page.locator("a").filter({ hasText: /^ART$/ })).toBeVisible();
    await expect(page.locator("a").filter({ hasText: "ANC testing" })).toBeVisible();

    // When I select ANC testing
    await page.locator("a").filter({ hasText: "ANC testing" }).click();

    // Updated map is rendered
    await waitForPlotUpdate();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("input-map-anc.png");

    // When I select a sub-region of the map
    await page.getByRole("button", { name: "Malawi - Demo" }).first().click();
    await page.locator("a").filter({ hasText: "Malawi - Demo" }).locator('[data-name="chevron-right"]').click();
    await page.locator("a").filter({ hasText: "Northern" }).first().click();
    // wait for animation here or otherwise debouncing of map bounds update can mean 2nd animation doesn't run
    // because it is clicked too quickly by playwright
    await waitForAnimations(page.locator("#review-inputs"));
    await page.locator("a").filter({ hasText: /^Central$/ }).click();

    // Updated map is shown
    await waitForPlotUpdate();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("input-map-southern.png");

    // When I click to adjust scale
    await page.getByRole('link', { name: 'Adjust scale' }).click();

    // Adjust scale menu is shown
    await expect(page.getByText('Filtered datasetDefaultCustomMinMax')).toBeVisible();
    await expect(page.getByLabel('Min')).toBeDisabled();
    await expect(page.getByLabel('Max')).toBeDisabled();

    // When I change the scale to custom
    await page.getByText('Custom').click();

    // Then adjust scale boxes are enabled
    await expect(page.getByLabel('Min')).toBeEnabled();
    await expect(page.getByLabel('Max')).toBeEnabled();

    // When I set a custom scale and click off
    await page.getByLabel('Max').fill('0.1');
    await page.getByLabel('Min').click();

    // Then plot colours have been updated
    await waitForPlotUpdate();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("input-map-custom-scale.png");
});
