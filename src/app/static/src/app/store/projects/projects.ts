import {Module} from 'vuex';
import {localStorageManager} from "../../localStorageManager";
import {RootState} from "../../root";
import {mutations} from "./mutations";
import {actions} from "./actions";
import {Version, Project} from "../../types";
import {Error} from "../../generated";

export interface ProjectsState {
    currentProject: Project | null,
    currentVersion: Version | null,
    previousProjects: Project[],
    loading: boolean,
    error: Error | null,
    versionUploadPending: boolean,
    versionTime: Date | null,
    cloneProjectError: Error | null,
    cloningProject: boolean
}

export const initialProjectsState = (): ProjectsState => {
    return {
        currentProject: null,
        currentVersion: null,
        previousProjects: [],
        loading: false,
        error: null,
        versionUploadPending: false,
        versionTime: null,
        cloneProjectError: null,
        cloningProject: false
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
