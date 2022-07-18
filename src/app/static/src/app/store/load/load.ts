import {actions} from "./actions";
import {mutations} from "./mutations";
import {Module} from "vuex";
import {RootState} from "../../root";
import {Error, ProjectRehydrateResultResponse} from "../../generated";

export enum LoadingState { NotLoading, SettingFiles, UpdatingState, LoadFailed }

export interface LoadState {
    loadingState: LoadingState,
    loadError: Error | null,
    rehydrateId: string
    preparing: boolean
    statusPollId: number
    complete: boolean
    rehydrateResult: ProjectRehydrateResultResponse
    projectName: string
}

export const initialLoadState = (): LoadState => {
    return {
        loadingState: LoadingState.NotLoading,
        loadError: null,
        rehydrateId: "",
        preparing: false,
        statusPollId: -1,
        complete: false,
        rehydrateResult: {} as ProjectRehydrateResultResponse,
        projectName: ""
    }
};

const namespaced = true;

export const load: Module<LoadState, RootState> = {
    namespaced,
    state: initialLoadState(),
    actions,
    mutations
};
