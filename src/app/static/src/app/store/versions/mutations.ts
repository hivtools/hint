import {MutationTree} from "vuex";
import {VersionsState} from "../versions/versions";
import {PayloadWithType, Version} from "../../types";

export enum VersionsMutations {
    SetManageVersions = "SetManageVersions",
    NewVersion = "NewVersion",
    VersionError = "VersionError"
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetManageVersions](state: VersionsState, action: PayloadWithType<boolean>) {
        state.manageVersions = action.payload;
    },
    [VersionsMutations.NewVersion](state: VersionsState, action: PayloadWithType<Version>) {
        state.manageVersions = true; //ensure Versions screen is displayed until state is reloaded
        state.currentVersion = action.payload;
        state.error = null;
    },
    [VersionsMutations.VersionError](state: VersionsState, action: PayloadWithType<Error>) {
        state.error = action.payload;
    }
};
