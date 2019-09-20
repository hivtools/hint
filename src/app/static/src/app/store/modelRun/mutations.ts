import {Mutation, MutationTree} from "vuex";
import {ModelRunState, ModelRunStatus} from "./modelRun";
import {PayloadWithType} from "../../types";
import {ModelSubmitResponse} from "../../generated";

type ModelRunMutation = Mutation<ModelRunState>

export interface ModelRunMutations {
    ModelRunStarted: ModelRunMutation
}

export const mutations: MutationTree<ModelRunState> & ModelRunMutations = {
    ModelRunStarted(state: ModelRunState, action: PayloadWithType<ModelSubmitResponse>) {
        state.modelRunId = action.payload.id;
        state.status = ModelRunStatus.Started
    }
};
