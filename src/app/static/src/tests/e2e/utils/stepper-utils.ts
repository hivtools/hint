import { Page } from '@playwright/test';

export async function getActiveStepIndex(page: Page): Promise<number> {
    return page.evaluate(() => {
        const steps = Array.from(document.querySelectorAll('.col.step'));
        return steps.findIndex(step => step.classList.contains('active'));
    });
}
