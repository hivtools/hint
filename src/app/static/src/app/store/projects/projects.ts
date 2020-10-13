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
    versionTime: Date | null
}

export const initialProjectsState = (): ProjectsState => {
    return {
        currentProject: null,
        currentVersion: null,
        previousProjects: [],
        loading: false,
        error: null,
        versionUploadPending: false,
        versionTime: null
    }
};

const namespaced: boolean = true;

export const projects: Module<ProjectsState, RootState> = {
    namespaced,
    state: initialProjectsState(),
    mutations,
    actions
};
