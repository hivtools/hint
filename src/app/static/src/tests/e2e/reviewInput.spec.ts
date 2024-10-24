import {expect, test} from "./fixtures/project-page";
import {waitForAnimations} from "./utils/utils";
import {Step} from "../../app/types";

test("can view time series plot", async ({ projectPage }) => {
    const page = projectPage.page;
    await projectPage.goToStep(Step.ReviewInputs);

    // Review inputs page matches screenshot after data fetched
    await expect(page.locator("#review-loading")).toHaveCount(0, {timeout: 10000});
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-landing.png");

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
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-page2.png", {timeout: 6000});

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
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-region.png", {timeout: 6000})

    // Paging is hidden
    await expect(page.locator("#page-number")).toHaveCount(0);

    // When I remove selected quarter
    await page.getByRole('button', { name: 'Quarter 4' }).first().click();
    await page.locator('a').filter({ hasText: 'Quarter 4' }).click();
    await page.locator('#app').click();

    // No data message is shown
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-no-data.png")

    // When I change data source
    await page.getByRole("button", { name: "ART", exact: true }).click();
    await page.locator("a").filter({ hasText: "ANC testing" }).click();

    // Plot has updated
    // Fetching ANC data takes a while, toHaveScreenshot checks the expectation as soon as 2 sequential screenshots
    // return the same image. So because ANC data fetch takes a while, this is taking 2 screenshots before the UI
    // updates, returning and erroring. So wait for response before testing it.
    await page.waitForResponse(resp => resp.url().includes('/chart-data/input-time-series/anc') && resp.status() === 200)
    await expect(page.locator("#review-inputs")).toHaveScreenshot("time-series-anc.png")
});

test("can view input map plot", async ({ projectPage }) => {
    const page = projectPage.page;
    await projectPage.goToStep(Step.ReviewInputs);

    // Given map plot is open
    await page.getByText("Map").click();

    // Map is rendered
    await expect(page.locator("#review-loading")).toHaveCount(0, {timeout: 10000});
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("input-map-landing.png");

    // Show base map checkbox is shown and checked by default
    await expect(page.getByRole('checkbox')).toBeVisible()
    await expect(page.getByRole('checkbox')).toBeChecked()
    await expect(page.locator(".leaflet-tile-container")).toHaveCount(1);

    // When I uncheck show base map checkbox
    await page.getByRole('checkbox').uncheck();

    // Updated map is shown without base map
    await expect(page.getByRole('checkbox')).not.toBeChecked()
    await expect(page.locator(".leaflet-tile-container")).toHaveCount(0);

    // When I recheck show base map checkbox
    await page.getByRole('checkbox').check();
    
    // Updated map is shown with base map
    await expect(page.getByRole('checkbox')).toBeChecked()
    await expect(page.locator(".leaflet-tile-container")).toHaveCount(1);

    // When I change indicator
    await page.getByRole("button", { name: "HIV prevalence" }).click();
    await page.locator("a").filter({ hasText: "Viral load suppression" }).click();

    // Updated map is rendered
    await expect(page.locator("#review-inputs")).toHaveScreenshot("input-map-vls.png");

    // When I open data source menu
    await page.getByRole("button", { name: "Household survey" }).click();

    // All data sources are shown
    await expect(page.locator("a").filter({ hasText: "Household survey" })).toBeVisible();
    await expect(page.locator("a").filter({ hasText: /^ART$/ })).toBeVisible();
    await expect(page.locator("a").filter({ hasText: "ANC testing" })).toBeVisible();

    // When I select ANC testing
    await page.locator("a").filter({ hasText: "ANC testing" }).click();

    // Updated map is rendered
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
    await expect(page.locator("#review-inputs")).toHaveScreenshot("input-map-custom-scale.png");
});
