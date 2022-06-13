import {Mutation, MutationTree} from 'vuex';
import {LoadingState, LoadState} from "./load";
import {PayloadWithType} from "../../types";
import {
    Error,
    ProjectRehydrateStatusResponse
    , ProjectRehydrateSubmitResponse
} from "../../generated";

type LoadMutation = Mutation<LoadState>

export interface LoadMutations {
    SettingFiles: LoadMutation,
    UpdatingState: LoadMutation,
    LoadFailed: LoadMutation,
    LoadStateCleared: LoadMutation,
    PreparingModelOutput: LoadMutation,
    ModelOutputStatusUpdated: LoadMutation,
    ModelOutputError: LoadMutation,
    PollingStatusStarted: LoadMutation
}

export const mutations: MutationTree<LoadState> & LoadMutations = {
    SettingFiles(state: LoadState) {
        state.loadingState = LoadingState.SettingFiles;
    },
    UpdatingState(state: LoadState) {
        state.loadingState = LoadingState.UpdatingState;
    },
    LoadFailed(state: LoadState, action: PayloadWithType<Error>) {
        state.loadingState = LoadingState.LoadFailed;
        state.loadError = action.payload;
    },
    LoadStateCleared(state: LoadState) {
        //For both load success and clear error
        state.loadingState = LoadingState.NotLoading;
        state.loadError = null;
    },
    PreparingModelOutput(state: LoadState, action: PayloadWithType<ProjectRehydrateSubmitResponse>) {
        state.downloadId = action.payload.id;
        state.preparing = true;
        state.complete = false;
        state.loadError = null;
    },
    ModelOutputStatusUpdated(state: LoadState, action: PayloadWithType<ProjectRehydrateStatusResponse>) {
        if (action.payload.done) {
            stopPolling(state);
        }
        state.loadError = null;
    },
    ModelOutputError(state: LoadState, action: PayloadWithType<Error>) {
        state.loadingState = LoadingState.NotLoading;
        state.loadError = action.payload;
        state.preparing = false;
        if (state.statusPollId > -1) {
            stopPolling(state);
        }
    },
    PollingStatusStarted(state: LoadState, action: PayloadWithType<number>) {
        state.statusPollId = action.payload;
    }
};

const stopPolling = (state: LoadState) => {
    clearInterval(state.statusPollId);
    state.statusPollId = -1;
};