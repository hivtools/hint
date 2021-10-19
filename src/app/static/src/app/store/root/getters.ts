import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {Warning} from "../../generated";
import {StepWarnings} from "../../types";

interface RootGetters {
    isGuest: Getter<RootState, RootState>
    warnings: Getter<RootState, RootState>
}

export const getters: RootGetters & GetterTree<RootState, RootState> = {
    isGuest: (state: RootState, getters: any) => {
        return state.currentUser == "guest";
    },

    warnings: (state: RootState) => (stepName: string) => {
        const filterWarnings = (warnings: Warning[], stepName: string) =>
            ( warnings || []).filter(warning => warning.locations.find(location => location === stepName))

        return {
            modelOptions: filterWarnings(state.modelOptions.warnings, stepName),
            modelRun: filterWarnings(state.modelRun.warnings, stepName),
            modelCalibrate: filterWarnings(state.modelCalibrate.warnings, stepName)
        }
    }
};
