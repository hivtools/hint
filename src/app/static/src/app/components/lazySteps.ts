import {AsyncComponentLoader, defineAsyncComponent} from "vue";
import StepLoading from "./StepLoading.vue";
import StepLoadError from "./StepLoadError.vue";

// One loader for each step after the first. The step component and the prefetch use the same
// function, so the browser fetches, parses and runs each module only once.
export const stepLoaders = {
    reviewInputs: () => import("./reviewInputs/ReviewInputs.vue"),
    modelOptions: () => import("./modelOptions/ModelOptions.vue"),
    modelRun: () => import("./modelRun/ModelRun.vue"),
    modelCalibrate: () => import("./modelCalibrate/ModelCalibrate.vue"),
    modelOutput: () => import("./modelOutput/ModelOutput.vue"),
    downloadResults: () => import("./downloadResults/DownloadResults.vue")
};

const RETRY_DELAY_MS = 1000;

export const lazyStep = (loader: AsyncComponentLoader) => defineAsyncComponent({
    loader,
    loadingComponent: StepLoading,
    errorComponent: StepLoadError,
    // Show no spinner when the file loads fast (for example when the prefetch has loaded it)
    delay: 200,
    // One retry, for a connection that dropped. It cannot fix a file that a deploy removed. For that,
    // the error component asks the user to reload.
    onError(_error, retry, fail, attempts) {
        if (attempts <= 1) {
            setTimeout(retry, RETRY_DELAY_MS);
        } else {
            fail();
        }
    }
});

// Safari has no requestIdleCallback
const FALLBACK_IDLE_DELAY_MS = 1000;

const whenIdle = (): Promise<void> => new Promise(resolve => {
    if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => resolve(), {timeout: 5000});
    } else {
        setTimeout(resolve, FALLBACK_IDLE_DELAY_MS);
    }
});

const saveDataEnabled = (): boolean => !!(navigator as any).connection?.saveData;

/**
 * Loads the files of the steps, one at a time in step order, when the browser is idle. Most users
 * spend time on the first step, so the other steps are ready before they need them. We stop at the
 * first failure: a step that is opened later shows the error component if its file is still missing.
 * Users who have asked to save data do not get the prefetch.
 */
export const prefetchSteps = async (loaders: Array<() => Promise<unknown>> = Object.values(stepLoaders)) => {
    if (saveDataEnabled()) {
        return;
    }
    for (const load of loaders) {
        await whenIdle();
        try {
            await load();
        } catch {
            return;
        }
    }
};
