import {Module} from 'vuex';
import {RootState} from "../../root";
import {mutations} from "./mutations";
import {actions} from "./actions";
import {Version, Project, DatasetResource} from "../../types";
import {Error} from "../../generated";

export interface ProjectsState {
    currentProject: Project | null,
    currentVersion: Version | null,
    previousProjects: Project[],
    loading: boolean,
    error: Error | null,
    versionUploadInProgress: boolean,
    queuedVersionUploadIntervalId: number;
    versionTime: Date | null,
    cloneProjectError: Error | null,
    cloningProject: boolean
    adrRehydrateOutputZip: DatasetResource | null,
    // If a project load is underway, blocks further mutations from updating local storage
    loadingProject: boolean
}

export const initialProjectsState = (): ProjectsState => {
    return {
        currentProject: null,
        currentVersion: null,
        previousProjects: [],
        loading: false,
        error: null,
        versionUploadInProgress: false,
        queuedVersionUploadIntervalId: -1,
        versionTime: null,
        cloneProjectError: null,
        cloningProject: false,
        adrRehydrateOutputZip: null,
        loadingProject: false
    }
};

const namespaced = true;

export const projects: Module<ProjectsState, RootState> = {
    namespaced,
    state: initialProjectsState(),
    mutations,
    actions
};
