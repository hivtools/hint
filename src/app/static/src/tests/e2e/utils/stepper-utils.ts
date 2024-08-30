import { Page } from '@playwright/test';

export async function getActiveStepIndex(page: Page): Promise<number> {
    // Wait for the active class to appear on any step element, need this
    // to avoid potential timing issues if it runs too quickly
    await page.waitForSelector('.col.step.active');

    return page.evaluate(() => {
        const steps = Array.from(document.querySelectorAll('.col.step'));
        return steps.findIndex(step => step.classList.contains('active'));
    });
}
