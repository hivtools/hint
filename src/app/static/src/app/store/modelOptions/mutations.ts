import {Mutation, MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";

type ModelOptionsMutation = Mutation<ModelOptionsState>

export interface MetadataMutations {
    validate: ModelOptionsMutation,
    update: ModelOptionsMutation
}

export const mutations: MutationTree<ModelOptionsState> & MetadataMutations = {
    validate(state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        // TODO validate from server
        state.valid = true;
    },

    update(state: ModelOptionsState, payload: DynamicFormMeta) {
        state.optionsFormMeta = payload;
    }
};
