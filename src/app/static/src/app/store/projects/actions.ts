import {RootMutation} from "../root/mutations";
import {ErrorsMutation} from "../errors/mutations";
import {ActionContext, ActionTree, Commit} from "vuex";
import {ProjectsState} from "./projects";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ProjectsMutations} from "./mutations";
import {serialiseState} from "../../localStorageManager";
import qs from "qs";
import {Project, SnapshotDetails, SnapshotIds} from "../../types";

export interface ProjectsActions {
    createProject: (store: ActionContext<ProjectsState, RootState>, name: string) => void,
    getProjects: (store: ActionContext<ProjectsState, RootState>) => void
    uploadSnapshotState: (store: ActionContext<ProjectsState, RootState>) => void,
    newSnapshot: (store: ActionContext<ProjectsState, RootState>) => void,
    loadSnapshot: (store: ActionContext<ProjectsState, RootState>, snapshot: SnapshotIds) => void
}

export const actions: ActionTree<ProjectsState, RootState> & ProjectsActions = {
    async createProject(context, name) {
        const {commit, state} = context;

        //Ensure we have saved the current snapshot
        if (state.currentSnapshot) {
            immediateUploadSnapshotState(context);
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

    async uploadSnapshotState(context) {
        const {state, commit} = context;
        if (state.currentSnapshot) {
            if (!state.snapshotUploadPending) {
                commit({type: ProjectsMutations.SetSnapshotUploadPending, payload: true});
                setTimeout(() => {
                    immediateUploadSnapshotState(context);
                }, 2000);
            }
        }
    },

    async newSnapshot(context) {
        const {state} = context;
        await immediateUploadSnapshotState(context);

        const projectId = state.currentProject && state.currentProject.id;
        const snapshotId = state.currentSnapshot && state.currentSnapshot.id;
        api<ProjectsMutations, ErrorsMutation>(context)
            .withSuccess(ProjectsMutations.SnapshotCreated)
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`project/${projectId}/snapshot/?parent=${snapshotId}`)
    },

    async loadSnapshot(context, snapshot) {
        const {commit, dispatch, state} = context;

        commit({type: ProjectsMutations.SetLoading, payload: true});
        await api<ProjectsMutations, ProjectsMutations>(context)
            .ignoreSuccess()
            .withError(ProjectsMutations.ProjectError)
            .get<SnapshotDetails>(`project/${snapshot.projectId}/snapshot/${snapshot.snapshotId}`)
            .then((response: any) => {
                if (state.error === null) {
                    dispatch("load/loadFromSnapshot", response.data, {root: true})
                }
            });
    }
};

async function immediateUploadSnapshotState(context: ActionContext<ProjectsState, RootState>) {
    const {state, commit, rootState} = context;
    commit({type: ProjectsMutations.SetSnapshotUploadPending, payload: false});
    const projectId = state.currentProject && state.currentProject.id;
    const snapshotId = state.currentSnapshot && state.currentSnapshot.id;
    if (projectId && snapshotId) {
        await api<ProjectsMutations, ErrorsMutation>(context)
            .withSuccess(ProjectsMutations.SnapshotUploadSuccess)
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`/project/${projectId}/snapshot/${snapshotId}/state/`, serialiseState(rootState));
    }
}

