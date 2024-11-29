import {expect, test} from "./fixtures/project-page";
import {Step} from "../../app/types";
import {calibrateModel} from "./utils/utils";

test("can view time series plot", async ({ projectPage }) => {
    const page = projectPage.page;
    await projectPage.goToStep(Step.CalibrateModel);

    await calibrateModel(page);

    // Calibration plot is visible
    await expect(page.locator('#calibration-plot')).toBeVisible();

    // Calibration plot is rendered correctly
    await expect(page.locator("#calibration-plot")).toHaveScreenshot("calibration-plot-landing.png")

    // When I update to view a ratio indicator
    await page.getByRole('button', { name: 'HIV prevalence' }).click();
    await page.locator('a').filter({ hasText: 'Population proportion' }).click();

    // Calibration plot is rendered correctly
    await expect(page.locator("#calibration-plot")).toHaveScreenshot("calibration-plot-ratio.png")
})
