import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";
import {VersionInfo} from "../../generated";

export interface ModelCalibrateState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    fetching: boolean
    complete: boolean
    version: VersionInfo
}

export const initialModelCalibrateState = (): ModelCalibrateState => {
    return {
        optionsFormMeta: {controlSections: []},
        options: {},
        fetching: false,
        complete: false,
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"}
    }
};

export const modelCalibrateGetters = {
    complete: (state: ModelCalibrateState) => {
        return state.complete; //TODO: replace with result check when available, and update modelRun complete too - what will that now return?
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const modelCalibrate: Module<ModelCalibrateState, RootState> = {
    namespaced,
    state: {...initialModelCalibrateState(), ...existingState && existingState.modelCalibrate},
    mutations,
    actions,
    getters: modelCalibrateGetters
};
