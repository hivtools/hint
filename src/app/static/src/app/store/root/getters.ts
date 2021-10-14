import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {Warning} from "../../generated";

interface RootGetters {
    isGuest: Getter<RootState, RootState>
    warnings: Getter<RootState, RootState>
}

export const getters: RootGetters & GetterTree<RootState, RootState> = {
    isGuest: (state: RootState, getters: any) => {
        return state.currentUser == "guest";
    },

    warnings: (getters: any, rootGetters: any, rootState: RootState) => (stepName: string) => {

        const warnings = {
            modelOptions: rootState.modelOptions.warnings,
            modelRun: rootState.modelRun.warnings,
            modelCalibrate: rootState.modelCalibrate.warnings
        }

        const filterWarnings = (warnings: Warning[], stepName: string) =>
            warnings.filter(warning => !!warning.locations.find(location => location === stepName))

        return {
            modelOptions: filterWarnings(warnings.modelOptions, stepName),
            modelRun: filterWarnings(warnings.modelRun, stepName),
            modelCalibrate: filterWarnings(warnings.modelCalibrate, stepName)
        }
    }
};