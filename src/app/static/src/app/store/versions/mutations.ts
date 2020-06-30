import {MutationTree} from "vuex";
import {VersionsState} from "./versions";
import {PayloadWithType, Version} from "../../types";

export enum VersionsMutations {
    SetManageVersions = "SetManageVersions",
    SetLoading = "SetLoading",
    VersionError = "VersionError"
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetManageVersions](state: VersionsState, action: PayloadWithType<boolean>) {
        state.manageVersions = action.payload;
    },
    [VersionsMutations.SetLoading](state: VersionsState, action: PayloadWithType<boolean>) {
        state.loading = action.payload;
    },
    [VersionsMutations.VersionError](state: VersionsState, action: PayloadWithType<Error>) {
        state.error = action.payload;
        state.loading = false;
    }
};
