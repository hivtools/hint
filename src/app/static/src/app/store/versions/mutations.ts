import {MutationTree} from "vuex";
import {VersionsState} from "./versions";
import {PayloadWithType, Version} from "../../types";
import {Error} from "../../generated";

export enum VersionsMutations {
    SetManageVersions = "SetManageVersions",
    SetLoading = "SetLoading",
    SetPreviousVersions = "SetPreviousVersions",
    VersionError = "VersionError"
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetManageVersions](state: VersionsState, action: PayloadWithType<boolean>) {
        state.manageVersions = action.payload;
    },
    [VersionsMutations.SetLoading](state: VersionsState, action: PayloadWithType<boolean>) {
        state.loading = action.payload;
    },
    [VersionsMutations.SetPreviousVersions](state: VersionsState, action: PayloadWithType<Version[]>) {
        state.previousVersions = action.payload;
        state.loading = false;
    },
    [VersionsMutations.VersionError](state: VersionsState, action: PayloadWithType<Error>) {
        state.error = action.payload;
        state.loading = false;
    }
};
