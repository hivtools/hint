import {test, expect} from "./fixtures/project-page";
import {uploadAllTestFiles} from "./utils/upload-utils";
import {getActiveStep} from "./utils/stepper-utils";
import {Step} from "../../app/types";

test("can progress to model options page", async ({ projectPage }) => {
    const page = projectPage.page;

    // When I create a new project
    await projectPage.createProject();

    // Upload inputs step is active
    expect(await getActiveStep(projectPage.page)).toBe(Step.UploadInputs);

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
    expect(await getActiveStep(projectPage.page)).toBe(Step.ReviewInputs);

    // and continue button is disabled
    await expect(continueButton).toBeDisabled();

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
    expect(await getActiveStep(projectPage.page)).toBe(Step.ModelOptions);
});
