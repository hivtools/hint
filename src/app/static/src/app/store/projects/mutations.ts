import {MutationTree} from "vuex";
import {ProjectsState} from "./projects";
import {PayloadWithType, Version, Project, VersionIds} from "../../types";
import {Error} from "../../generated";

export enum ProjectsMutations {
    SetLoading = "SetLoading",
    SetPreviousProjects = "SetPreviousProjects",
    SetVersionUploadPending = "SetVersionUploadPending",
    ProjectError = "ProjectError",
    VersionCreated = "VersionCreated",
    VersionUploadSuccess = "VersionUploadSuccess",
    ClearCurrentVersion = "ClearCurrentVersion",
    CloneProjectError = "CloneProjectError",
    CloningProject = "CloningProject"
}

export const mutations: MutationTree<ProjectsState> = {

    [ProjectsMutations.CloneProjectError](state: ProjectsState, action: PayloadWithType<Error>) {
        state.cloneProjectError = action.payload
    },

    [ProjectsMutations.CloningProject](state: ProjectsState, action: PayloadWithType<boolean>) {
        state.cloningProject = action.payload
    },

    [ProjectsMutations.SetLoading](state: ProjectsState, action: PayloadWithType<boolean>) {
        state.error = null;
        state.loading = action.payload;
    },
    [ProjectsMutations.SetPreviousProjects](state: ProjectsState, action: PayloadWithType<Project[]>) {
        state.previousProjects = action.payload;
        state.loading = false;
    },
    [ProjectsMutations.SetVersionUploadPending](state: ProjectsState, action: PayloadWithType<boolean>) {
        state.versionUploadPending = action.payload;
    },
    [ProjectsMutations.ProjectError](state: ProjectsState, action: PayloadWithType<Error>) {
        state.error = action.payload;
        state.loading = false;
    },
    [ProjectsMutations.VersionCreated](state: ProjectsState, action: PayloadWithType<Version>) {
        const version = action.payload;
        state.currentProject!.versions.push(version);
        state.currentVersion = version;
    },
    [ProjectsMutations.VersionUploadSuccess](state: ProjectsState) {
        state.versionTime = new Date(Date.now());
    },
    [ProjectsMutations.ClearCurrentVersion](state: ProjectsState) {
        state.currentProject = null;
        state.currentVersion = null;
    }
};
