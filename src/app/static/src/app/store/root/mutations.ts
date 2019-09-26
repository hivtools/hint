import {MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";

export const mutations: MutationTree<RootState> = {
    Reset(state: RootState) {
        console.log("resetting");
        Object.assign(state, emptyState);
    }
};
