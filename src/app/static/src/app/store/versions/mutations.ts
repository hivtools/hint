import {MutationTree} from "vuex";
import {VersionsState} from "./versions";
import {PayloadWithType} from "../../types";
import {Error} from "../../generated";

export enum VersionsMutations {
    SetManageVersions = "SetManageVersions",
    SetLoading = "SetLoading",
    SetSnapshotUploadPending = "SetSnapshotUploadPending",
    VersionError = "VersionError",
    SnapshotUploadError = "SnapshotUploadError"
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetManageVersions](state: VersionsState, action: PayloadWithType<boolean>) {
        state.manageVersions = action.payload;
    },
    [VersionsMutations.SetLoading](state: VersionsState, action: PayloadWithType<boolean>) {
        state.loading = action.payload;
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
    }
};
