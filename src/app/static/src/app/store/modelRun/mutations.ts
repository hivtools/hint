import {MutationTree} from "vuex";
import {maxPollErrors, ModelRunState} from "./modelRun";
import {PayloadWithType} from "../../types";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";

export enum ModelRunMutation {
    ModelRunStarted = "ModelRunStarted",
    ModelRunError = "ModelRunError",
    RunStatusUpdated = "RunStatusUpdated",
    PollingForStatusStarted = "PollingForStatusStarted",
    RunResultFetched = "RunResultFetched",
    RunResultError = "RunResultError",
    RunStatusError = "RunStatusError",
    Ready = "Ready"
}

export const mutations: MutationTree<ModelRunState> = {
    [ModelRunMutation.ModelRunStarted](state: ModelRunState, action: PayloadWithType<ModelSubmitResponse>) {
        state.modelRunId = action.payload.id;
        state.status = {id: action.payload.id} as ModelStatusResponse;
        state.errors = [];
    },

    [ModelRunMutation.RunStatusUpdated](state: ModelRunState, action: PayloadWithType<ModelStatusResponse>) {
        if (action.payload.done) {
            stopPolling(state);
        }
        state.status = action.payload;
        state.errors = [];
    },

    [ModelRunMutation.PollingForStatusStarted](state: ModelRunState, action: PayloadWithType<number>) {
        state.statusPollId = action.payload;
    },

    [ModelRunMutation.RunResultFetched](state: ModelRunState, action: PayloadWithType<ModelResultResponse>) {
        state.result = action.payload;
    },

    [ModelRunMutation.RunResultError](state: ModelRunState, action: PayloadWithType<string>) {
        state.errors.push(action.payload);
    },

    [ModelRunMutation.Ready](state: ModelRunState) {
        state.ready = true;
    },

    [ModelRunMutation.ModelRunError](state: ModelRunState, action: PayloadWithType<string>) {
        state.errors.push(action.payload);
    },

    [ModelRunMutation.RunStatusError](state: ModelRunState, action: PayloadWithType<string>) {
        state.errors.push(action.payload);
        if (state.errors.length >= maxPollErrors) {
            stopPolling(state);
            state.status = {} as ModelStatusResponse;
            state.modelRunId = "";
            state.errors.push("Unable to retrieve model run status. Please retry the model run, or contact support if the error persists.");
        }
    },
};

const stopPolling = (state: ModelRunState) => {
    clearInterval(state.statusPollId);
    state.statusPollId = -1;
};


