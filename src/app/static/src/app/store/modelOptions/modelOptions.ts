import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormMeta, DynamicFormData, formMeta} from "../../components/forms/types";
import {mutations} from "./mutations";
import {actions} from "./actions";

export interface ModelOptionsState {
    optionsMeta: DynamicFormMeta
    options: DynamicFormData
    valid: boolean
}

export const initialModelOptionsState: ModelOptionsState = {
    optionsMeta: {...formMeta},
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
    actions,
    mutations,
    getters: modelOptionsGetters
};
