import {Mutation, MutationTree} from "vuex";
import {localStorageKey, ModelRunState} from "./modelRun";
import {PayloadWithType} from "../../types";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {readyStateMutations} from "../shared/readyStateMutations";

type ModelRunMutation = Mutation<ModelRunState>

export interface ModelRunMutations {
    ModelRunStarted: ModelRunMutation
    RunStatusUpdated: ModelRunMutation,
    PollingForStatusStarted: ModelRunMutation,
    RunResultFetched: ModelRunMutation,
    RunResultError: ModelRunMutation,
    Ready: ModelRunMutation
}

export const mutations: MutationTree<ModelRunState> & ModelRunMutations = {
    ModelRunStarted(state: ModelRunState, action: PayloadWithType<ModelSubmitResponse>) {
        state.modelRunId = action.payload.id;
        state.status = {id: action.payload.id} as ModelStatusResponse
    },

    RunStatusUpdated(state: ModelRunState, action: PayloadWithType<ModelStatusResponse>) {
        if (action.payload.done) {
            clearInterval(state.statusPollId);
            state.statusPollId = -1;
        }
        state.status = action.payload;
    },

    PollingForStatusStarted(state: ModelRunState, action: PayloadWithType<number>) {
        state.statusPollId = action.payload;
    },

    RunResultFetched(state: ModelRunState, action: PayloadWithType<ModelResultResponse>) {
        state.result = action.payload;
    },

    RunResultError(state: ModelRunState, action: PayloadWithType<string>) {
        state.errors.push(action.payload);
    },

    ...readyStateMutations
};
