import {Mutation, MutationTree} from 'vuex';
import {LoadingState, LoadState} from "./load";
import {PayloadWithType} from "../../types";
import {
    Error, ProjectRehydrateResultResponse,
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
    PollingStatusStarted: LoadMutation,
    RehydrateResult: LoadMutation,
    RehydrateResultError: LoadMutation
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
    RehydrateResult(state: LoadState, action: PayloadWithType<ProjectRehydrateResultResponse>) {
        state.rehydrateResult = action.payload;
        state.preparing = false;
        state.loadingState = LoadingState.NotLoading;
    },
    RehydrateResultError(state: LoadState, action: PayloadWithType<Error>) {
        state.loadError = action.payload;
        state.preparing = false;
        state.loadingState = LoadingState.LoadFailed;
        if (state.statusPollId > -1) {
            stopPolling(state);
        }
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
    PollingStatusStarted(state: LoadState, action: PayloadWithType<number>) {
        state.statusPollId = action.payload;
    }
};

const stopPolling = (state: LoadState) => {
    clearInterval(state.statusPollId);
    state.statusPollId = -1;
};