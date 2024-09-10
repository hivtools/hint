import type {Locator, Page} from '@playwright/test';
import {test as base} from './worker-login';
import {generateId} from "zoo-ids";
import {Step} from "../../../app/types";
import {uploadAllTestFiles} from "../utils/uploadUtils";
import {setValidModelOptions} from "../utils/modelOptionsUtils";
import {calibrateModel, fitModel} from "../utils/utils";

class ProjectPage {
    private readonly projectNames: string[];
    private readonly deletedProjectNames: string[];

    constructor(public readonly page: Page) {
        this.projectNames = [];
        this.deletedProjectNames = [];
    };

    async createProject(prefix: string = "") {
        await this.goToProjectPage();
        const projectName = `${prefix}${generateId(Math.random())}`;
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
        return this.page.locator(`#projects-table .row:has(.name-cell:has-text("${projectName}"))`).nth(0);
    };

    async goToProjectPage() {
        const projectsHeading = this.page.getByRole('heading', { name: 'Projects', exact: true });
        const count = await projectsHeading.count();

        if (count === 0) {
            await this.page.getByRole('link', { name: 'Projects' }).click();
        }
    };

    async goToStep(step: Step) {
        let continueButton: Locator
        const goToInputsUpload = async () => this.createProject();
        const goToReviewInputs = async () => {
            await uploadAllTestFiles(this.page);
            continueButton = this.page.locator("#continue").nth(0);
            await continueButton.click();
        };
        const goToModelOptions = async () => {
            await continueButton.click();
        };
        const goToFitModel = async () => {
            await setValidModelOptions(this.page);
            await continueButton.click();
        };
        const goToCalibrate = async () => {
            await fitModel(this.page);
            await continueButton.click();
        };
        const goToReviewOutput = async () => {
            await calibrateModel(this.page);
            await continueButton.click();
        };
        const goToSaveResults = async () => {};
        const steps = [
            goToInputsUpload,
            goToReviewInputs,
            goToModelOptions,
            goToFitModel,
            goToCalibrate,
            goToReviewOutput,
            goToSaveResults
        ]
        for (let i = 1; i <= step; i++) {
            await steps[i - 1]();
        }
    }
}

export const test = base.extend<{ projectPage: ProjectPage }>({
    projectPage: async ({ page }, use) => {
        const projectPage = new ProjectPage(page);
        await projectPage.page.goto("/");
        await use(projectPage);
        await projectPage.deleteAllProjects();
    },
});
export { expect } from '@playwright/test';
