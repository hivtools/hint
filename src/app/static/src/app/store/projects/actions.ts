import {RootMutation} from "../root/mutations";
import {ErrorsMutation} from "../errors/mutations";
import {ActionContext, ActionTree, Commit} from "vuex";
import {ProjectsState} from "./projects";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ProjectsMutations} from "./mutations";
import {serialiseState} from "../../localStorageManager";
import qs from "qs";
import {Project, VersionDetails, VersionIds} from "../../types";

export interface ProjectsActions {
    createProject: (store: ActionContext<ProjectsState, RootState>, name: string) => void,
    getProjects: (store: ActionContext<ProjectsState, RootState>) => void
    uploadVersionState: (store: ActionContext<ProjectsState, RootState>) => void,
    newVersion: (store: ActionContext<ProjectsState, RootState>) => void,
    loadVersion: (store: ActionContext<ProjectsState, RootState>, version: VersionIds) => void
    deleteProject: (store: ActionContext<ProjectsState, RootState>, projectId: number) => void
    deleteVersion: (store: ActionContext<ProjectsState, RootState>, versionIds: VersionIds) => void
    userExists: (store: ActionContext<ProjectsState, RootState>, email: string) => void
}

export const actions: ActionTree<ProjectsState, RootState> & ProjectsActions = {

    async userExists(context, email) {
        return await api<RootMutation, ProjectsMutations>(context)
            .ignoreSuccess()
            .ignoreErrors()
            .get<String>(`/user/${email}`);
    },

    async createProject(context, name) {
        const {commit, state} = context;

        //Ensure we have saved the current version
        if (state.currentVersion) {
            immediateUploadVersionState(context);
        }

        commit({type: ProjectsMutations.SetLoading, payload: true});
        await api<RootMutation, ProjectsMutations>(context)
            .withSuccess(RootMutation.SetProject, true)
            .withError(ProjectsMutations.ProjectError)
            .postAndReturn<String>("/project/", qs.stringify({name}));
    },

    async getProjects(context) {
        const {commit} = context;
        commit({type: ProjectsMutations.SetLoading, payload: true});
        await api<ProjectsMutations, ProjectsMutations>(context)
            .withSuccess(ProjectsMutations.SetPreviousProjects)
            .withError(ProjectsMutations.ProjectError)
            .get<Project[]>("/projects/");
    },

    async uploadVersionState(context) {
        const {state, commit} = context;
        if (state.currentVersion) {
            if (!state.versionUploadPending) {
                commit({type: ProjectsMutations.SetVersionUploadPending, payload: true});
                setTimeout(() => {
                    immediateUploadVersionState(context);
                }, 2000);
            }
        }
    },

    async newVersion(context) {
        const {state} = context;
        await immediateUploadVersionState(context);

        const projectId = state.currentProject && state.currentProject.id;
        const versionId = state.currentVersion && state.currentVersion.id;
        api<ProjectsMutations, ErrorsMutation>(context)
            .withSuccess(ProjectsMutations.VersionCreated)
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`project/${projectId}/version/?parent=${versionId}`)
    },

    async loadVersion(context, version) {
        const {commit, dispatch, state} = context;

        commit({type: ProjectsMutations.SetLoading, payload: true});
        await api<ProjectsMutations, ProjectsMutations>(context)
            .ignoreSuccess()
            .withError(ProjectsMutations.ProjectError)
            .get<VersionDetails>(`project/${version.projectId}/version/${version.versionId}`)
            .then((response: any) => {
                if (state.error === null) {
                    dispatch("load/loadFromVersion", response.data, {root: true})
                }
            });
    },

    async deleteProject(context, projectId) {
        const {commit, dispatch, state} = context;

        if (state.currentProject && state.currentProject.id === projectId) {
            commit({type: ProjectsMutations.ClearCurrentVersion});
        }
        await api<ProjectsMutations, ProjectsMutations>(context)
            .ignoreSuccess()
            .withError(ProjectsMutations.ProjectError)
            .delete(`project/${projectId}`)
            .then(() => {
                dispatch("getProjects");
            });
    },

    async deleteVersion(context, versionIds) {
        const versionId = versionIds.versionId;
        const projectId = versionIds.projectId;
        const {commit, dispatch, state} = context;

        if (state.currentVersion && state.currentVersion.id === versionId) {
            commit({type: ProjectsMutations.ClearCurrentVersion});
        }
        await api<ProjectsMutations, ProjectsMutations>(context)
            .ignoreSuccess()
            .withError(ProjectsMutations.ProjectError)
            .delete(`project/${projectId}/version/${versionId}`)
            .then(() => {
                dispatch("getProjects");
            });
    }
};

async function immediateUploadVersionState(context: ActionContext<ProjectsState, RootState>) {
    const {state, commit, rootState} = context;
    commit({type: ProjectsMutations.SetVersionUploadPending, payload: false});
    const projectId = state.currentProject && state.currentProject.id;
    const versionId = state.currentVersion && state.currentVersion.id;
    if (projectId && versionId) {
        await api<ProjectsMutations, ErrorsMutation>(context)
            .withSuccess(ProjectsMutations.VersionUploadSuccess)
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`/project/${projectId}/version/${versionId}/state/`, serialiseState(rootState));
    }
}

