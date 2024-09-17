import { Page } from '@playwright/test';
import {Step} from "../../../app/types";

export async function getActiveStep(page: Page): Promise<Step> {
    // Wait for the active class to appear on any step element, need this
    // to avoid potential timing issues if it runs too quickly
    await page.waitForSelector('.col.step.active');

    return page.evaluate(() => {
        const steps = Array.from(document.querySelectorAll('.col.step'));
        const stepIdx = steps.findIndex(step => step.classList.contains('active'));
        return stepIdx + 1;
    });
}
