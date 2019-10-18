import {Mutation, MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {PayloadWithType} from "../../types";
import {ValidationResult} from "../../components/forms/types";

type ModelOptionsMutation = Mutation<ModelOptionsState>

export interface MetadataMutations {
    ModelOptionsSaved: ModelOptionsMutation
}

export const mutations: MutationTree<ModelOptionsState> & MetadataMutations = {
    ModelOptionsSaved(state: ModelOptionsState, action: PayloadWithType<ValidationResult>) {
        state.options = action.payload.data;
        state.valid = action.payload.valid;
    }
};
