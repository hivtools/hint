import {actions} from "./actions";
import {mutations} from "./mutations";
import type {Module} from "vuex";
import type {RootState} from "../../root";
import {initialLoadState, type LoadState} from "./state";

const namespaced = true;

export const load: Module<LoadState, RootState> = {
    namespaced,
    state: initialLoadState(),
    actions,
    mutations
};
