import {Locator, Page, expect} from "@playwright/test";

export const waitForAnimations = async (locator: Locator) => {
    await locator.evaluate(e => Promise.all(e.getAnimations({subtree: true}).map(animation => animation.finished)));
}

export async function fitModel(page: Page) {
    await page.getByRole('button', { name: 'Fit model' }).click();
    await expect(page.locator('div').filter({ hasText: /^Initialising model fitting$/ })).toBeVisible();
    // Extra timeout here, model fit can take a while to complete. This timeout will be enough for the mock model
    // but probably not a real fit.
    await expect(page.getByRole('heading', { name: 'Model fitting complete' })).toBeVisible({
        timeout: 20_000
    });
}

export async function calibrateModel(page: Page) {
    await page.getByRole('button', { name: 'Calibrate' }).click();
    await expect(page.locator('div').filter({ hasText: /^Calibrating\.\.\.$/ })).toBeVisible();
    // Extra timeout here, calibration can take a while to complete.
    await expect(page.getByRole('heading', { name: 'Calibration complete' })).toBeVisible({
        timeout: 20_000
    });
}
