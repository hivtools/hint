import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";
import {VersionInfo} from "../../generated";

export interface ModelOptionsState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    valid: boolean
    fetching: boolean
    version: VersionInfo
}

export const initialModelOptionsState = (): ModelOptionsState => {
    return {
        optionsFormMeta: {controlSections: []},
        options: {},
        valid: false,
        fetching: false,
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"}
    }
};

export const modelOptionsGetters = {
    complete: (state: ModelOptionsState) => {
        return state.valid
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const modelOptions: Module<ModelOptionsState, RootState> = {
    namespaced,
    state: {...initialModelOptionsState(), ...existingState && existingState.modelOptions},
    mutations,
    actions,
    getters: modelOptionsGetters
};
