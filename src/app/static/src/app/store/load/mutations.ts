import {Mutation, MutationTree} from 'vuex';
import {LoadingState, LoadState, RehydrateProjectResponse} from "./state";
import {PayloadWithType} from "../../types";
import {Error} from "../../generated";

type LoadMutation = Mutation<LoadState>

export interface LoadMutations {
    SettingFiles: LoadMutation,
    UpdatingState: LoadMutation,
    LoadFailed: LoadMutation,
    LoadStateCleared: LoadMutation,
    StartPreparingRehydrate: LoadMutation,
    RehydrateResult: LoadMutation,
    RehydrateResultError: LoadMutation,
    SetNewProjectName: LoadMutation,
}

export const mutations: MutationTree<LoadState> & LoadMutations = {
    SettingFiles(state: LoadState) {
        state.loadingState = LoadingState.SettingFiles;
    },
    SetNewProjectName(state: LoadState, projectName: string) {
        state.newProjectName = projectName
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
    StartPreparingRehydrate(state: LoadState) {
        state.preparing = true;
        state.loadingState = LoadingState.SettingFiles;
    },
    RehydrateResult(state: LoadState, action: PayloadWithType<RehydrateProjectResponse>) {
        console.log("committing rehydrate result", action)
        state.rehydrateResult = action.payload;
        state.preparing = false;
        state.loadingState = LoadingState.NotLoading;
        state.loadError = null;
    },
    RehydrateResultError(state: LoadState, action: PayloadWithType<Error>) {
        console.log("committing rehydrate result error", action)
        state.loadError = action.payload;
        state.preparing = false;
        state.rehydrateResult = {} as RehydrateProjectResponse
        state.loadingState = LoadingState.LoadFailed;
    },
};
