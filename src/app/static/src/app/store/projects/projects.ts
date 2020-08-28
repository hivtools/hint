import {Module} from 'vuex';
import {localStorageManager} from "../../localStorageManager";
import {RootState} from "../../root";
import {mutations} from "./mutations";
import {actions} from "./actions";
import {Snapshot, Project} from "../../types";
import {Error} from "../../generated";

export interface ProjectsState {
    currentProject: Project | null,
    currentSnapshot: Snapshot | null,
    previousProjects: Project[],
    loading: boolean,
    error: Error | null,
    snapshotUploadPending: boolean,
    snapshotTime: Date | null
}

export const initialProjectsState = (): ProjectsState => {
    return {
        currentProject: null,
        currentSnapshot: null,
        previousProjects: [],
        loading: false,
        error: null,
        snapshotUploadPending: false,
        snapshotTime: null
    }
};

const namespaced: boolean = true;

const existingState = localStorageManager.getState();

export const projects: Module<ProjectsState, RootState> = {
    namespaced,
    state: {...initialProjectsState(), ...existingState && existingState.projects},
    mutations,
    actions
};
