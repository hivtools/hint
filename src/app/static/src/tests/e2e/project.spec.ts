import {expect, test} from "./fixtures/project-page"
import {getActiveStep} from "./utils/stepper-utils";
import {Step} from "../../app/types";

test('can create and delete a project', async ({ projectPage }) => {
    // When I create a project
    const projectName = await projectPage.createProject();

    // Then Stepper is shown
    await expect(projectPage.page.locator("#stepper")).toBeVisible();

    // And the first step is active
    expect(await getActiveStep(projectPage.page)).toBe(Step.UploadInputs);

    // And project name and version is shown
    await expect(projectPage.page.getByText(`Project: ${projectName} v1`)).toBeVisible();

    // When I go back to projects page
    await projectPage.goToProjectPage();

    // Then project is shown in list
    await expect(projectPage.findProjectByName(projectName)).toBeVisible()

    // And return to current project button is shown
    await expect(projectPage.page.getByRole('link', { name: 'Return to current project' })).toBeVisible();

    // When I delete the project
    await projectPage.deleteProject(projectName);

    // Then project has disappeared from list
    await expect(projectPage.findProjectByName(projectName)).toHaveCount(0);

    // And return to project button is not shown
    await expect(projectPage.page.getByRole('link', { name: 'Return to current project' })).toHaveCount(0);
});
