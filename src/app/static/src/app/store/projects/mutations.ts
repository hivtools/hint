import {MutationTree} from "vuex";
import {ProjectsState} from "./projects";
import {PayloadWithType, Snapshot, Project} from "../../types";
import {Error} from "../../generated";

export enum ProjectsMutations {
    SetLoading = "SetLoading",
    SetPreviousProjects = "SetPreviousProjects",
    SetSnapshotUploadPending = "SetSnapshotUploadPending",
    ProjectError = "ProjectError",
    SnapshotCreated = "SnapshotCreated",
    SnapshotUploadSuccess = "SnapshotUploadSuccess"
}

export const mutations: MutationTree<ProjectsState> = {
    [ProjectsMutations.SetLoading](state: ProjectsState, action: PayloadWithType<boolean>) {
        state.error = null;
        state.loading = action.payload;
    },
    [ProjectsMutations.SetPreviousProjects](state: ProjectsState, action: PayloadWithType<Project[]>) {
        state.previousProjects = action.payload;
        state.loading = false;
    },
    [ProjectsMutations.SetSnapshotUploadPending](state: ProjectsState, action: PayloadWithType<boolean>) {
        state.snapshotUploadPending = action.payload;
    },
    [ProjectsMutations.ProjectError](state: ProjectsState, action: PayloadWithType<Error>) {
        state.error = action.payload;
        state.loading = false;
    },
    [ProjectsMutations.SnapshotCreated](state: ProjectsState, action: PayloadWithType<Snapshot>) {
        const snapshot = action.payload;
        state.currentProject!.snapshots.push(snapshot);
        state.currentSnapshot = snapshot;
    },
    [ProjectsMutations.SnapshotUploadSuccess](state: ProjectsState) {
        state.snapshotTime = new Date(Date.now());
    }
};
