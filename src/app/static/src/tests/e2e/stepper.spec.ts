import {test, expect} from "./fixtures/project-page";
import {uploadAllTestFiles} from "./utils/uploadUtils";
import {getActiveStep} from "./utils/stepperUtils";
import {Step} from "../../app/types";
import {setValidModelOptions} from "./utils/modelOptionsUtils";
import {calibrateModel, fitModel} from "./utils/utils";

test("can go through whole estimates process", async ({ projectPage }) => {
    const { page } = projectPage;

    // When I create a new project
    await projectPage.createProject();

    // Upload inputs step is active
    expect(await getActiveStep(page)).toBe(Step.UploadInputs);

    // Continue button is disabled
    const continueButton = page.locator("#continue").nth(0);
    await expect(continueButton).toBeDisabled();

    // Back button is disabled
    const backButton = page.locator("#back").nth(0);
    await expect(backButton).toBeDisabled();

    // When I upload all files
    await uploadAllTestFiles(page);

    // Continue button is enabled
    await expect(continueButton).not.toBeDisabled();

    // Back button is disabled
    await expect(backButton).toBeDisabled();

    // When I click continue
    await continueButton.click();

    // Review input step is active
    expect(await getActiveStep(page)).toBe(Step.ReviewInputs);

    // and back button is enabled
    await expect(backButton).not.toBeDisabled();

    // When review input has finished loading
    await expect(page.locator("#review-loading")).toHaveCount(0, {timeout: 10000});

    // Continue and back buttons are enabled
    await expect(continueButton).not.toBeDisabled();
    await expect(backButton).not.toBeDisabled();

    // When I click continue
    await continueButton.click();

    // Model options page is active
    expect(await getActiveStep(page)).toBe(Step.ModelOptions);

    // Continue button is disabled
    await expect(continueButton).toBeDisabled();
    await expect(backButton).not.toBeDisabled();

    // When I fill in options and click validate
    await setValidModelOptions(page);

    // then continue button is enabled
    await expect(continueButton).not.toBeDisabled();
    await expect(backButton).not.toBeDisabled();

    // When I click continue
    await continueButton.click();

    // Model fit page is active
    expect(await getActiveStep(page)).toBe(Step.FitModel);

    // Continue button is disabled
    await expect(continueButton).toBeDisabled();
    await expect(backButton).not.toBeDisabled();

    // When I fit the model
    await fitModel(page);

    // Continue button is enabled
    await expect(continueButton).not.toBeDisabled();
    await expect(backButton).not.toBeDisabled();

    // When I click continue
    await continueButton.click();

    // then model calibrate page is active
    expect(await getActiveStep(page)).toBe(Step.CalibrateModel);

    // and continue button is disabled
    await expect(continueButton).toBeDisabled();
    await expect(backButton).not.toBeDisabled();

    // When I calibrate model
    await calibrateModel(page);

    // Calibration plot is visible
    await expect(page.locator('canvas')).toBeVisible();

    // Continue button is enabled
    await expect(continueButton).not.toBeDisabled();
    await expect(backButton).not.toBeDisabled();

    // When I click continue
    await continueButton.click();

    // then review outputs page is active
    expect(await getActiveStep(page)).toBe(Step.ReviewOutput);

    // Continue button is enabled
    await expect(continueButton).not.toBeDisabled();
    await expect(backButton).not.toBeDisabled();

    // When I click continue
    await continueButton.click();

    // Download results page is active
    expect(await getActiveStep(page)).toBe(Step.SaveResults);

    // And I can see file downloads
    const downloadResults = page.locator("#spectrum-download button");
    const coarseOutput = page.locator("#coarse-output-download button");
    const summaryReport = page.locator("#summary-download button");
    const comparisonReport = page.locator("#comparison-download button");
    await expect(downloadResults).toHaveClass(/btn-secondary/);
    await expect(coarseOutput).toHaveClass(/btn-secondary/);
    await expect(summaryReport).toHaveClass(/btn-secondary/);
    await expect(comparisonReport).toHaveClass(/btn-secondary/);
});
