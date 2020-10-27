import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";

export interface ModelCalibrateState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    fetching: boolean
    complete: boolean
}

export const initialModelCalibrateState = (): ModelCalibrateState => {
    return {
        optionsFormMeta: {controlSections: []},
        options: {},
        fetching: false,
        complete: false
    }
};

const namespaced = true;
const existingState = localStorageManager.getState();

export const modelCalibrate: Module<ModelCalibrateState, RootState> = {
    namespaced,
    state: {...initialModelCalibrateState(), ...existingState && existingState.modelCalibrate},
    mutations,
    actions
};
