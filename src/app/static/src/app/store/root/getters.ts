import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {Warning} from "../../generated";
import {Dict} from "../../types";

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
    isGuest: (state: RootState, getters: any) => {
        return state.currentUser == "guest";
    },

    warnings: (state: RootState) => (stepName: string) => {
        const filterWarnings = (warnings: Warning[], stepLocation: string) =>
            warnings.filter(warning => warning.locations.some(location => location === stepLocation))

        const location = warningStepLocationMapping[stepName]

        return {
            modelOptions: filterWarnings(state.modelOptions.warnings, location),
            modelRun: filterWarnings(state.modelRun.warnings, location),
            modelCalibrate: filterWarnings(state.modelCalibrate.warnings, location)
        }
    }
};
