import {MutationTree} from "vuex";
import {VersionsState} from "./versions";
import {PayloadWithType, Snapshot, Version} from "../../types";
import {Error} from "../../generated";

export enum VersionsMutations {
    SetLoading = "SetLoading",
    SetPreviousVersions = "SetPreviousVersions",
    SetSnapshotUploadPending = "SetSnapshotUploadPending",
    VersionError = "VersionError",
    SnapshotUploadError = "SnapshotUploadError",
    SnapshotCreated = "SnapshotCreated"
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetLoading](state: VersionsState, action: PayloadWithType<boolean>) {
        state.loading = action.payload;
    },
    [VersionsMutations.SetPreviousVersions](state: VersionsState, action: PayloadWithType<Version[]>) {
    state.previousVersions = action.payload;
    state.loading = false;
    },
    [VersionsMutations.SetSnapshotUploadPending](state: VersionsState, action: PayloadWithType<boolean>) {
        state.snapshotUploadPending = action.payload;
    },
    [VersionsMutations.VersionError](state: VersionsState, action: PayloadWithType<Error>) {
        state.error = action.payload;
        state.loading = false;
    },
    [VersionsMutations.SnapshotUploadError](state: VersionsState, action: PayloadWithType<Error>) {
        console.error(action.payload);
    },
    [VersionsMutations.SnapshotCreated](state: VersionsState, action: PayloadWithType<Snapshot>) {
        const snapshot = action.payload;
        state.currentVersion!.snapshots.push(snapshot);
        state.currentSnapshot = snapshot;
    }
};
