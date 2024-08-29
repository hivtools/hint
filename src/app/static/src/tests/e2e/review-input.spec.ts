import {test, expect} from "./fixtures/project-page";
import {uploadAllTestFiles} from "./utils/upload-utils";

test('can view review input plots', async ({ projectPage }) => {
    const page = projectPage.page;
    await projectPage.createProject();

    // When I upload all files
    await uploadAllTestFiles(page);

    // Continue button is active
    const continueButton = page.locator("#continue").nth(0);
    await expect(continueButton).not.toHaveClass("disabled");

    // When I click continue
    await continueButton.click();

    // Review inputs page matches screenshot after data fetched
    await expect(page.locator("#review-loading")).not.toBeVisible();
    await expect(page.locator("#review-inputs")).toHaveScreenshot("review-input-landing.png");
});
