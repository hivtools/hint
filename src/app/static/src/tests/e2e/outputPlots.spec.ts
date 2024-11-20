import {expect, test} from "./fixtures/project-page";
import {Step} from "../../app/types";
import {calibrateModel} from "./utils/utils";

test("can view output plots", async ({ projectPage }) => {
    const page = projectPage.page;
    await projectPage.goToStep(Step.ReviewOutput);

    // Choropleth is visible
    await expect(page.locator('.leaflet-container')).toBeVisible();

    // and choropleth is rendered as expected
    await expect(page.locator("#review-output")).toHaveScreenshot("choropleth-landing.png");

    // When I switch to barchart tab
    await page.getByText('Bar').click();
    // This can take a little while to redraw the error bars, so give it a second
    await page.waitForTimeout(500);

    // barchart is rendered as expected
    await expect(page.locator("#review-output")).toHaveScreenshot("barchart-landing.png");

    // When I update barchart x-axis plot control
    await page.getByRole('button', { name: 'Age' }).click();
    await page.locator('a').filter({ hasText: 'Area' }).first().click();
    // This can take a little while to redraw the error bars, so give it a second
    await page.waitForTimeout(500);

    // barchart is rendered as expected
    await expect(page.locator("#review-output")).toHaveScreenshot("barchart-x-axis.png");

    // When I update disaggregate by plot control
    await page.getByRole('button', { name: 'Sex' }).click();
    await page.locator('a').filter({ hasText: 'Age' }).nth(1).click();

    // barchart is rendered as expected
    await expect(page.locator("#review-output")).toHaveScreenshot("barchart-disaggregate-by.png");

    // When I update a filter
    await page.getByRole('button', { name: '55-59', exact: true }).click();
    // This can take a little while to redraw the error bars, so give it a second
    await page.waitForTimeout(500);

    // barchart is rendered as expected
    await expect(page.locator("#review-output")).toHaveScreenshot("barchart-update-filter.png");

    // When I hide a bar via the plotly control
    // We have to locate this via position as we can't get a handle on it, consider removing this if it is flaky
    await page.locator('canvas').click({
        position: {
            x: 71,
            y: 15
        }
    });

    // barchart is rendered as expected
    await expect(page.locator("#review-output")).toHaveScreenshot("barchart-hide-bar.png");

    // When I switch to table tab
    await page.getByText('Table').click();

    // Then table is shown
    await expect(page.locator("#review-output")).toHaveScreenshot("table-landing.png");

    // When I update a table preset
    await page.getByRole('button', { name: 'Sex by area' }).click();
    await page.locator('a').filter({ hasText: 'Sex by 5 year age group' }).click();

    // Then table is updated
    await expect(page.locator("#review-output")).toHaveScreenshot("table-sex-by-age.png");

    // When I update a filter
    await page.getByRole('button', { name: 'HIV prevalence' }).click();
    await page.locator('a').filter({ hasText: /^ART coverage$/ }).click();

    // Then table is updated
    await expect(page.locator("#review-output")).toHaveScreenshot("table-art-coverage.png");

    // When I switch to comparison tab
    await page.getByText('Comparison').click();

    // Then comparison plot is shown
    await expect(page.locator("#review-output")).toHaveScreenshot("comparison-landing.png");

    // When I switch indicator
    await page.getByRole('button', { name: 'HIV prevalence' }).click();
    await page.locator('a').filter({ hasText: 'ANC prevalence age matched' }).click();

    // X-axis and plot are updated as expected
    await expect(page.locator("#review-output")).toHaveScreenshot("comparison-anc-prevalence.png");

    // When I switch to bubble tab
    await page.getByText('Bubble').click();

    // Then bubble plot is shown
    await expect(page.locator("#review-output")).toHaveScreenshot("bubble-landing.png");

    // When I update the bubble size
    await page.getByRole('link', { name: 'Adjust scale' }).first().click();
    await page.getByText('Custom').click();
    await page.getByLabel('Max').fill('500000');
    await page.getByText('Filtered datasetDefaultCustomMinMax').click();
    await page.getByRole('link', { name: 'Done' }).click();

    // bubble plot is updated
    await expect(page.locator("#review-output")).toHaveScreenshot("bubble-size.png");

    // When I change the size indicator
    await page.getByRole('button', { name: 'PLHIV' }).click();
    await page.locator('a').filter({ hasText: 'Population' }).nth(1).click();

    // bubble plot is updated
    await expect(page.locator("#review-output")).toHaveScreenshot("bubble-size-indicator.png");

    // When I change colour indicator
    await page.getByRole('button', { name: 'HIV prevalence' }).click();
    await page.locator('a').filter({ hasText: 'ART coverage' }).first().click();

    // bubble plot is updated
    await expect(page.locator("#review-output")).toHaveScreenshot("bubble-colour-indicator.png");

    // When I zoom the map in
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Zoom in' }).click();

    // bubble plot is updated, wait first for animation to complete
    await page.waitForTimeout(500);
    await expect(page.locator("#review-output")).toHaveScreenshot("bubble-zoom.png");

    // When I reset the plot
    await page.getByRole('button', { name: 'reset' }).click();

    // bubble plot is updated
    await expect(page.locator("#review-output")).toHaveScreenshot("bubble-reset.png");
})
