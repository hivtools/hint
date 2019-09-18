import {Mutation, MutationTree} from "vuex";
import {ModelRunState} from "./modelRun";
import {PayloadWithType} from "../../types";
import {ModelStatusResponse, ModelSubmitResponse} from "../../generated";

type ModelRunMutation = Mutation<ModelRunState>

export interface ModelRunMutations {
    ModelRunStarted: ModelRunMutation
    RunStatusUpdated: ModelRunMutation,
    PollingForStatusStarted: ModelRunMutation
}

export const mutations: MutationTree<ModelRunState> & ModelRunMutations = {
    ModelRunStarted(state: ModelRunState, action: PayloadWithType<ModelSubmitResponse>) {
        state.modelRunId = action.payload.id;
        state.status = "Started"
    },

    RunStatusUpdated(state: ModelRunState, action: PayloadWithType<ModelStatusResponse>) {
        if (action.payload.done){
            state.status = "Complete";
            clearInterval(state.statusPollId);
            state.statusPollId = -1;
        }
    },

    PollingForStatusStarted(state: ModelRunState, action: PayloadWithType<number>) {
        state.statusPollId = action.payload
    }

};
