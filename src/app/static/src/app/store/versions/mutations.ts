import {MutationTree} from "vuex";
import {VersionsState} from "./versions";
import {PayloadWithType} from "../../types";
import {Error} from "../../generated";

export enum VersionsMutations {
    SetLoading = "SetLoading",
    VersionError = "VersionError"
}

export const mutations: MutationTree<VersionsState> = {
    [VersionsMutations.SetLoading](state: VersionsState, action: PayloadWithType<boolean>) {
        state.loading = action.payload;
    },
    [VersionsMutations.VersionError](state: VersionsState, action: PayloadWithType<Error>) {
        state.error = action.payload;
        state.loading = false;
    }
};
