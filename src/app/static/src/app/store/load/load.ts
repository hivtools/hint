import {actions} from "./actions";
import {mutations} from "./mutations";
import {Module} from "vuex";
import {RootState} from "../../root";

export interface LoadState {
    loadError: string
}

export const initialLoadState: LoadState = {
    loadError: ""
};

const namespaced: boolean = true;

export const load: Module<LoadState, RootState> = {
    namespaced,
    state: {...initialLoadState},
    actions,
    mutations
};
