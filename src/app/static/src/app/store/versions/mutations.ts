import {MutationTree} from "vuex";
import {VersionsState} from "./versions";
import {PayloadWithType, Version} from "../../types";
import {Error} from "../../generated";

export enum VersionsMutations {
    SetLoading = "SetLoading",
    SetPreviousVersions = "SetPreviousVersions",
    SetSnapshotUploadPending = "SetSnapshotUploadPending",
    VersionError = "VersionError",
    SnapshotUploadSuccess = "SnapshotUploadSuccess"
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
    [VersionsMutations.SnapshotUploadSuccess](state: VersionsState) {
        state.snapshotTime = new Date(Date.now());
    }
};
