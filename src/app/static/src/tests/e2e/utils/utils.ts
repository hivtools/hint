import {Locator} from "@playwright/test";

// Build a callback which you can use to wait for changes to the inner HTML of some Locator
// Can use this to wait for an update to happen before checking a screenshot.
export const buildWaitForUpdateCallback = async (locator: Locator, timeout: number = 50, retries: number = 10) => {
    let previousContent: string = await locator.evaluate(el => el.innerHTML);

    return async () => {

        for (let i = 0; i < retries; i++) {
            const currentContent = await locator.evaluate(el => el.innerHTML);

            if (currentContent !== previousContent) {
                previousContent = currentContent;
                return;
            }

            await new Promise(resolve => setTimeout(resolve, timeout));
        }

        throw new Error("Content did not update within the allowed retries");
    };
};


export const waitForAnimations = async (locator: Locator) => {
    await locator.evaluate(e => Promise.all(e.getAnimations({subtree: true}).map(animation => animation.finished)));
}
