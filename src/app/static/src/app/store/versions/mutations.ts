import {MutationTree} from "vuex";
import {VersionsState} from "../versions/versions";
import {PayloadWithType} from "../../types";

export enum VersionsMutations {
    SetManageVersions = "SetManageVersions",
    NewVersion = "NewVersion",
    VersionError = "VersionError"
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetManageVersions](state: VersionsState, action: PayloadWithType<boolean>) {
        state.manageVersions = action.payload;
    },
    [VersionsMutations.NewVersion](state: VersionsState, action: PayloadWithType<string>) {
        state.userVersion = action.payload;
        state.error = null;
    },
    [VersionsMutations.VersionError](state: VersionsState, action: PayloadWithType<Error>) {
        state.error = action.payload;
    }
};
