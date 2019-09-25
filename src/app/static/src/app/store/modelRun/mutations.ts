import {Mutation, MutationTree} from "vuex";
import {localStorageKey, ModelRunState, ModelRunStatus} from "./modelRun";
import {PayloadWithType} from "../../types";
import {ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {localStorageManager} from "../../localStorageManager";

type ModelRunMutation = Mutation<ModelRunState>

export interface ModelRunMutations {
    ModelRunStarted: ModelRunMutation
    RunStatusUpdated: ModelRunMutation,
    PollingForStatusStarted: ModelRunMutation
}

export const mutations: MutationTree<ModelRunState> & ModelRunMutations = {
    ModelRunStarted(state: ModelRunState, action: PayloadWithType<ModelSubmitResponse>) {
        state.modelRunId = action.payload.id;
        state.status = ModelRunStatus.Started;
        state.success = false;

        localStorageManager.setItem(localStorageKey, state);
    },

    RunStatusUpdated(state: ModelRunState, action: PayloadWithType<ModelStatusResponse>) {
        if (action.payload.done){
            state.status = ModelRunStatus.Complete;
            clearInterval(state.statusPollId);
            state.statusPollId = -1;

            if (action.payload.success){
                state.success = true;
            }

            localStorageManager.setItem(localStorageKey, state);
        }
    },

    PollingForStatusStarted(state: ModelRunState, action: PayloadWithType<number>) {
        state.statusPollId = action.payload;
    }

};
