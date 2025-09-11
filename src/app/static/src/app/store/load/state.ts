import {Error, ProjectState} from "../../generated";

// NB We define state and initialLoadState in separate file to the load module to 
// avoid circular dependency issues when calling root emptyState from 
// load/actions

export enum LoadingState { NotLoading, SettingFiles, UpdatingState, LoadFailed }

export type RehydrateProjectResponse = {
    notes?: string | null,
    state: ProjectState
}

export interface LoadState {
    loadingState: LoadingState,
    loadError: Error | null,
    preparing: boolean
    complete: boolean
    rehydrateResult: RehydrateProjectResponse
    newProjectName: string
}

export const initialLoadState = (): LoadState => {
    return {
        loadingState: LoadingState.NotLoading,
        loadError: null,
        preparing: false,
        complete: false,
        rehydrateResult: {} as RehydrateProjectResponse,
        newProjectName: ""
    }
};
