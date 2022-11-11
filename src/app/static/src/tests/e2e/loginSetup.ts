import { chromium, FullConfig } from '@playwright/test';

async function loginSetup(config: FullConfig) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    // Extract the project's name from the CLI as this
    // isn't available to the global setup
    const project = process.argv.find(arg => arg.includes('project'))
    const projectName = project.split("=")[1]
    const projectConfig = config.projects.find(cfg => cfg._id === projectName)
    const baseURL = projectConfig.use.baseURL

    await page.goto(baseURL);
    await page.getByLabel('Username (email address)').fill('test.user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByText('Log In').click();
    // Save signed-in state to 'storageState.json'.
    await page.context().storageState({ path: 'storageState.json' });
    await browser.close();
}

export default loginSetup;
