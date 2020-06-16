import {MutationTree} from "vuex";
import {VersionsState} from "../versions/versions";
import {PayloadWithType} from "../../types";

export enum VersionsMutations {
    SetManageVersions = "SetManageVersions"
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetManageVersions](state: VersionsState, action: PayloadWithType<boolean>) {
        state.manageVersions = action.payload;
    }
};