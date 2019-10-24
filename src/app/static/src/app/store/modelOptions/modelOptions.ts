import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta, formMeta} from "../../components/forms/types";
import {mutations} from "./mutations";

export interface ModelOptionsState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    valid: boolean
}

export const initialModelOptionsState: ModelOptionsState = {
    optionsFormMeta: {...formMeta},
    options: {},
    valid: false
};

export const modelOptionsGetters = {
    complete: (state: ModelOptionsState) => {
        return state.valid
    }
};

const namespaced: boolean = true;

export const modelOptions: Module<ModelOptionsState, RootState> = {
    namespaced,
    state: {...initialModelOptionsState},
    mutations,
    getters: modelOptionsGetters
};
