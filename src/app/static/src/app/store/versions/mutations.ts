import {MutationTree} from "vuex";
import {VersionsState} from "./versions";
import {PayloadWithType} from "../../types";

export enum VersionsMutations {
    SetManageVersions = "SetManageVersions",
    SetFakeCurrentVersion = "SetFakeCurrentVersion" //NB This will be replaced by real implementation in next ticket
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetManageVersions](state: VersionsState, action: PayloadWithType<boolean>) {
        state.manageVersions = action.payload;
    },
    [VersionsMutations.SetFakeCurrentVersion](state: VersionsState) {
        state.currentVersion = "fakeCurrentVersion";
        state.currentSnapshot = "fakeCurrentSnapshot";
        state.manageVersions = false;
    }
};
