import {Mutation, MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";

export interface RootMutations {
    Reset: Mutation<RootState>
}

export const mutations: MutationTree<RootState> & RootMutations = {
    Reset(state: RootState) {
        Object.assign(state, emptyState);
    }
};
