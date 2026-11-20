import {type AsyncComponentLoader, defineAsyncComponent} from "vue";
import StepLoading from "./StepLoading.vue";
import StepLoadError from "./StepLoadError.vue";
import {Step} from "../types";

// One loader for each step after the first. The step component and the prefetch use the same
// function, so the browser fetches, parses and runs each module only once.
export const stepLoaders: Record<number, () => Promise<unknown>> = {
    [Step.ReviewInputs]: () => import("./reviewInputs/ReviewInputs.vue"),
    [Step.ModelOptions]: () => import("./modelOptions/ModelOptions.vue"),
    [Step.FitModel]: () => import("./modelRun/ModelRun.vue"),
    [Step.CalibrateModel]: () => import("./modelCalibrate/ModelCalibrate.vue"),
    [Step.ReviewOutput]: () => import("./modelOutput/ModelOutput.vue"),
    [Step.SaveResults]: () => import("./downloadResults/DownloadResults.vue")
};

const RETRY_DELAY_MS = 1000;

// In a production build, Vite loads the stylesheet of a step before its script, and it rejects with
// this message when the stylesheet fails. Its helper does not add a stylesheet that is already on the
// page, and the failed one stays. So a retry would show the step without its CSS.
const isStylesheetError = (error: Error) => /preload css/i.test(error.message);

export const lazyStep = (loader: AsyncComponentLoader) => defineAsyncComponent({
    loader,
    loadingComponent: StepLoading,
    errorComponent: StepLoadError,
    // Show no spinner when the file loads fast (for example when the prefetch has loaded it)
    delay: 200,
    // One retry, for a connection that dropped. It cannot fix a file that a deploy removed. For that,
    // and when a stylesheet failed, the error component asks the user to reload.
    onError(error, retry, fail, attempts) {
        if (attempts <= 1 && !isStylesheetError(error)) {
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
 * Loads the files of a step when the browser is idle. The Stepper calls it for the next step, so the
 * files are in the browser before the user needs them, and a user who stops early does not download
 * the later steps. Users who have asked to save data do not get the prefetch. If the load fails, we
 * do nothing: the step shows the error component when the user opens it and its file is still missing.
 */
export const prefetchStep = async (step: number, loaders = stepLoaders) => {
    const load = loaders[step];
    if (!load || saveDataEnabled()) {
        return;
    }
    await whenIdle();
    try {
        await load();
    } catch {
        // see above
    }
};
