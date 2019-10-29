import {Mutation, MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";
import {ModelRunOptions} from "../../generated";
import {PayloadWithType} from "../../types";

type ModelOptionsMutation = Mutation<ModelOptionsState>

export interface MetadataMutations {
    validate: ModelOptionsMutation,
    update: ModelOptionsMutation
    ModelOptionsFetched: ModelOptionsMutation
}

export const mutations: MutationTree<ModelOptionsState> & MetadataMutations = {
    validate(state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        // TODO validate from server
        state.valid = true;
    },

    update(state: ModelOptionsState, payload: DynamicFormMeta) {
        state.optionsFormMeta = payload;
    },

    ModelOptionsFetched(state: ModelOptionsState, action: PayloadWithType<ModelRunOptions>) {
        this.update(state, action.payload);
    },

    ModelOptionsError(state: ModelOptionsState, action: PayloadWithType<string>) {
        state.error = "Error fetching model options. Please contact the app administrator."
    }
};
