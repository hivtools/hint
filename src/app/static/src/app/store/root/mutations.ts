import {Mutation, MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";

export interface RootMutations {
    Reset: Mutation<RootState>
}

export const mutations: MutationTree<RootState> & RootMutations = {
    Reset(state: RootState) {
        Object.assign(state, emptyState);
        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
    }
};
