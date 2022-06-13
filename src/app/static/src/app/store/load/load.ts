import {actions} from "./actions";
import {mutations} from "./mutations";
import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";

export enum LoadingState { NotLoading, SettingFiles, UpdatingState, LoadFailed }

export interface LoadState {
    loadingState: LoadingState,
    loadError: Error | null,
    downloadId: string
    preparing: boolean
    statusPollId: number
    complete: boolean
}

export enum FileSource {
    ModelOutput = "OUTPUT"
}

export const initialLoadState = (): LoadState => {
    return {
        loadingState: LoadingState.NotLoading,
        loadError: null,
        downloadId: "",
        preparing: false,
        statusPollId: -1,
        complete: false
    }
};

const namespaced = true;

export const load: Module<LoadState, RootState> = {
    namespaced,
    state: initialLoadState(),
    actions,
    mutations
};
