import { test as setup } from '@playwright/test';
import {baseURL} from "../../../playwright.config";

setup("authenticate", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder('Email').fill('test.user@example.com');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByText('Log In').click();
    // Save signed-in state to 'storageState.json'.
    await page.context().storageState({ path: 'storageState.json' });
});
