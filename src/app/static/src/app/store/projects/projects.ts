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
    cloneProjectError: Error | null,
    cloningProject: boolean,
    versionUploadPending: boolean,
    versionTime: Date | null
}

export const initialProjectsState = (): ProjectsState => {
    return {
        currentProject: null,
        currentVersion: null,
        previousProjects: [],
        loading: false,
        error: null,
        cloneProjectError: null,
        cloningProject: false,
        versionUploadPending: false,
        versionTime: null
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
