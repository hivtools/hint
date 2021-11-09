import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {Error} from "../../generated"
import {Warning} from "../../generated";
import {Dict, StepWarnings} from "../../types";
import {extractErrors} from "../../utils";

interface RootGetters {
    isGuest: Getter<RootState, RootState>
    warnings: Getter<RootState, RootState>
}

const warningStepLocationMapping: Dict<string> = {
    modelOptions: "model_options",
    fitModel: "model_fit",
    calibrateModel: "model_calibrate",
    reviewOutput: "review_output",
    downloadResults: "download_results"
};

export const getters: RootGetters & GetterTree<RootState, RootState> = {
    isGuest: (state: RootState) => {
        return state.currentUser == "guest";
    },

    errors: (state: RootState) => {
        const {
            adr,
            adrUpload,
            baseline,
            downloadResults,
            load,
            metadata,
            modelCalibrate,
            modelOptions,
            modelOutput,
            plottingSelections,
            projects,
            surveyAndProgram
        } = state;

        return ([] as Error[]).concat.apply([] as Error[], [extractErrors(adr),
            extractErrors(adrUpload),
            extractErrors(baseline),
            extractErrors(downloadResults),
            extractErrors(load),
            extractErrors(metadata),
            extractErrors(modelCalibrate),
            extractErrors(modelOptions),
            extractErrors(modelOutput),
            extractErrors(plottingSelections),
            extractErrors(projects),
            extractErrors(surveyAndProgram),
            state.modelRun.errors,
            state.errors.errors]);
    },
    warnings: (state: RootState) => (stepName: string): StepWarnings => {
        const filterWarnings = (warnings: Warning[], stepLocation: string) =>
            stepLocation ?
                (warnings || []).filter(warning => warning.locations.some(location => location === stepLocation)) :
                [];

        const location = warningStepLocationMapping[stepName];

        return {
            modelOptions: filterWarnings(state.modelOptions.warnings, location),
            modelRun: filterWarnings(state.modelRun.warnings, location),
            modelCalibrate: filterWarnings(state.modelCalibrate.warnings, location)
        }
    }
}
