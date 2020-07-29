import {Module} from 'vuex';
import {localStorageManager} from "../../localStorageManager";
import {RootState} from "../../root";
import {mutations} from "./mutations";
import {actions} from "./actions";
import {Snapshot, Version} from "../../types";
import {Error} from "../../generated";

export interface VersionsState {
    currentVersion: Version | null,
    currentSnapshot: Snapshot | null,
    previousVersions: Version[],
    manageVersions: boolean,
    loading: boolean,
    error: Error | null
}

export const initialVersionsState = (): VersionsState => {
    return {
        currentVersion: null,
        currentSnapshot: null,
        previousVersions: [],
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
    mutations,
    actions
};
