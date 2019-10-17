import {Mutation, MutationTree} from 'vuex';
import {LoadingState, LoadState} from "./load";
import {PayloadWithType} from "../../types";

type LoadMutation = Mutation<LoadState>

export interface BaselineMutations {
    SettingFiles: LoadMutation,
    UpdatingState: LoadMutation,
    LoadSucceeded: LoadMutation,
    LoadFailed: LoadMutation
}

export const mutations: MutationTree<LoadState> & BaselineMutations = {
    SettingFiles(state: LoadState) {
        state.loadingState = LoadingState.SettingFiles;
    },
    UpdatingState(state: LoadState) {
        state.loadingState = LoadingState.UpdatingState;
    },
    LoadSucceeded(state: LoadState) {
        state.loadingState = LoadingState.NotLoading;
        state.loadError = "";
    },
    LoadFailed(state: LoadState, action: PayloadWithType<string>) {
        state.loadingState = LoadingState.LoadFailed;
        state.loadError = action.payload;
    },
    ClearLoadError(state: LoadState) {
        state.loadingState = LoadingState.NotLoading;
        state.loadError = "";
    }
}