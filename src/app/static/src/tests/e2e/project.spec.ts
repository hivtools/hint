import {expect, test} from "./fixtures/project-page"
import {getActiveStepIndex} from "./utils/stepper-utils";

test('can create and delete a project', async ({ projectPage }) => {
    // When I create a project
    const projectName = await projectPage.createProject();

    // Then Stepper is shown
    expect(await projectPage.page.locator("#stepper").isVisible());

    // And the first step is active
    expect(await getActiveStepIndex(projectPage.page)).toBe(0);

    // And project name and version is shown
    expect(await projectPage.page.getByText(`Project: ${projectName} v1`).isVisible());

    // When I go back to projects page
    await projectPage.goToProjectPage();

    // Then project is shown in list
    let projectExists = await projectPage.findProjectByName(projectName).isVisible();
    expect(projectExists).toBeTruthy();

    // And return to current project button is shown
    expect(await projectPage.page.getByRole('link', { name: 'Return to current project' }).isVisible()).toBeTruthy();

    // When I delete the project
    await projectPage.deleteProject(projectName);

    // Then project has disappeared from list
    projectExists = await projectPage.findProjectByName(projectName).isVisible();
    expect(projectExists).toBeFalsy();

    // And continue button is now shown
    expect(await projectPage.page.getByRole('link', { name: 'Return to current project' }).isVisible()).toBeFalsy();
});
