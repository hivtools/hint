import type {Locator, Page} from '@playwright/test';
import {test as base} from './worker-login';
import {generateId} from "zoo-ids";

class ProjectPage {
    private readonly projectNames: string[];
    private readonly deletedProjectNames: string[];

    constructor(public readonly page: Page) {
        this.projectNames = [];
        this.deletedProjectNames = [];
    };

    async createProject(prefix: string = "") {
        await this.goToProjectPage();
        const projectName = `${prefix}${generateId()}`;
        await this.page.getByRole('button', { name: 'New', exact: true }).click();
        await this.page.getByRole('button', { name: 'Create project' }).click();
        await this.page.getByRole('textbox', { name: 'Project name' }).click();
        await this.page.getByRole('textbox', { name: 'Project name' }).fill(projectName);
        await this.page.getByRole('button', { name: 'Create project' }).click();
        this.projectNames.push(projectName);
        return projectName;
    };

    async deleteProject(projectName: string) {
        await this.goToProjectPage();
        const projRow = this.findProjectByName(projectName);
        await projRow.locator('.delete-cell button').click();
        await this.page.getByRole('button', { name: 'OK' }).click();
        this.deletedProjectNames.push(projectName);
    };

    async deleteAllProjects() {
        for (const projectName of this.projectNames) {
            if (!this.deletedProjectNames.includes(projectName)) {
                await this.deleteProject(projectName);
            }
        }
    };

    findProjectByName(projectName: string): Locator {
        return this.page.locator(`#projects-table .row:has(.name-cell:has-text("${projectName}"))`);
    };

    async goToProjectPage() {
        const projectsHeading = this.page.getByRole('heading', { name: 'Projects', exact: true });
        if (!(await projectsHeading.isVisible())) {
            await this.page.getByRole('link', { name: 'Projects' }).click();
        }
    };
}

// Extend basic test by providing a "todoPage" fixture.
export const test = base.extend<{ projectPage: ProjectPage }>({
    projectPage: async ({ page }, use) => {
        const projectPage = new ProjectPage(page);
        await projectPage.page.goto("/");
        await use(projectPage);
        await projectPage.deleteAllProjects();
    },
});
export { expect } from '@playwright/test';
