import { chromium, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Dotenv reads from default ".env" file.
dotenv.config();

export const baseURL =  process.env.CI ? 'http://hint:8080' : 'http://localhost:8080'

async function loginSetup(config: FullConfig) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(baseURL);
    await page.getByLabel('Username (email address)').fill('test.user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByText('Log In').click();
    // Save signed-in state to 'storageState.json'.
    await page.context().storageState({ path: 'storageState.json' });
    await browser.close();
}

export default loginSetup;
