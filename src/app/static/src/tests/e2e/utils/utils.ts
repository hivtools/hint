import {Locator} from "@playwright/test";

export const waitForAnimations = async (locator: Locator) => {
    await locator.evaluate(e => Promise.all(e.getAnimations({subtree: true}).map(animation => animation.finished)));
}
