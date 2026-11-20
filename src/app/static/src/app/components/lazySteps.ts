import {AsyncComponentLoader, defineAsyncComponent} from "vue";
import StepLoading from "./StepLoading.vue";
import StepLoadError from "./StepLoadError.vue";

// One loader for each step after the first
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
