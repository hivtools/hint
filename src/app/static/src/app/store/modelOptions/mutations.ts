import {MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";

export enum ModelOptionsMutation {
    Validate = "Validate",
    Update = "Update"
}

export const ModelOptionsUpdates = [ModelOptionsMutation.Update];

export const mutations: MutationTree<ModelOptionsState> = {
    [ModelOptionsMutation.Validate](state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        // TODO validate from server
        state.valid = true;
    },

    [ModelOptionsMutation.Update](state: ModelOptionsState, payload: DynamicFormMeta) {
        state.optionsFormMeta = payload;
    }
};
