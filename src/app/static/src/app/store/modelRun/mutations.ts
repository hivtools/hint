import {Mutation, MutationTree} from "vuex";
import {localStorageKey, ModelRunState, ModelRunStatus} from "./modelRun";
import {PayloadWithType} from "../../types";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {localStorageManager} from "../../localStorageManager";
import {readyStateMutations} from "../shared/readyStateMutations";
import {FilteredDataState} from "../filteredData/filteredData";

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
        state.status = ModelRunStatus.Started;
        state.success = false;
    },

    RunStatusUpdated(state: ModelRunState, action: PayloadWithType<ModelStatusResponse>) {
        if (action.payload.done){
            state.status = ModelRunStatus.Complete;
            clearInterval(state.statusPollId);
            state.statusPollId = -1;

            if (action.payload.success){
                state.success = true;
            }
        }
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
