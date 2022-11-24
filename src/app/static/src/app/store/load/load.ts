import {actions} from "./actions";
import {mutations} from "./mutations";
import {Module} from "vuex";
import {RootState} from "../../root";
import {initialLoadState, LoadState} from "./state";

const namespaced = true;

export const load: Module<LoadState, RootState> = {
    namespaced,
    state: initialLoadState(),
    actions,
    mutations
};
