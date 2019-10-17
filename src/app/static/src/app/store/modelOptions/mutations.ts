import {Mutation, MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";

type ModelOptionsMutation = Mutation<ModelOptionsState>

export interface MetadataMutations {
    ModelOptionsValidated: ModelOptionsMutation
}

export const mutations: MutationTree<ModelOptionsState> & MetadataMutations = {

    ModelOptionsValidated(state: ModelOptionsState) {
        state.valid = true;
    }
};
