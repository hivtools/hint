import {Module} from 'vuex';
import {localStorageManager} from "../../localStorageManager";
import {RootState} from "../../root";
import {mutations} from "./mutations";
import {Error} from "../../generated";

export interface VersionsState {
    currentVersion: string | null, //NB string will be replaced by real type in next ticket
    currentSnapshot: string | null, //NB string will be replaced by real type in next ticket
    manageVersions: boolean,
    loading: boolean,
    error: Error | null
}

export const initialVersionsState = (): VersionsState => {
    return {
        currentVersion: null,
        currentSnapshot: null,
        manageVersions: false,
        loading: false,
        error: null
    }
};

const namespaced: boolean = true;

const existingState = localStorageManager.getState();

export const versions: Module<VersionsState, RootState> = {
    namespaced,
    state: {...initialVersionsState(), ...existingState && existingState.versions},
    mutations
};
