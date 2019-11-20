import {actions} from "./actions";
import {mutations} from "./mutations";
import {Module} from "vuex";
import {RootState} from "../../root";

export enum LoadingState { NotLoading, SettingFiles, UpdatingState, LoadFailed }

export interface LoadState {
    loadingState: LoadingState,
    loadError: string
}

export const initialLoadState = (): LoadState => {
    return {
        loadingState: LoadingState.NotLoading,
        loadError: ""
    }
};

const namespaced: boolean = true;

export const load: Module<LoadState, RootState> = {
    namespaced,
    state: initialLoadState(),
    actions,
    mutations
};
