import {Module} from "vuex";
import {RootState} from "../../root";
import {DynamicFormMeta} from "../../components/forms/types";
import {mutations} from "./mutations";
import {actions} from "./actions";

export interface ModelOptionsState {
    options: DynamicFormMeta
    valid: boolean
}

export const initialModelOptionsState: ModelOptionsState = {
    options: {controlSections: []},
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
