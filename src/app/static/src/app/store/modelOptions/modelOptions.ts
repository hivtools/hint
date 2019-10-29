import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";

export interface ModelOptionsState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    valid: boolean,
    error: string
}

export const initialModelOptionsState: ModelOptionsState = {
    optionsFormMeta: {controlSections: []},
    options: {},
    valid: false,
    error: ""
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
    state: {...initialModelOptionsState, ...existingState && existingState.modelOptions},
    mutations,
    actions,
    getters: modelOptionsGetters
};
