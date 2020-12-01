import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";
import {VersionInfo, Error} from "../../generated";

export interface ModelOptionsState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    valid: boolean
    validating: boolean
    fetching: boolean
    version: VersionInfo
    validateError: Error | null
    optionsError: Error | null
}

export const initialModelOptionsState = (): ModelOptionsState => {
    return {
        optionsFormMeta: {controlSections: []},
        options: {},
        valid: false,
        validating: false,
        fetching: false,
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        validateError: null,
        optionsError: null
    }
};

export const modelOptionsGetters = {
    complete: (state: ModelOptionsState) => {
        return state.valid
    }
};

const namespaced = true;
const existingState = localStorageManager.getState();

export const modelOptions: Module<ModelOptionsState, RootState> = {
    namespaced,
    state: {...initialModelOptionsState(), ...existingState && existingState.modelOptions},
    mutations,
    actions,
    getters: modelOptionsGetters
};
