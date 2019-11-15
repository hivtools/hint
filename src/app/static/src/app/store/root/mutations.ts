import {Mutation, MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";

export interface RootMutations {
    Reset: Mutation<RootState>
    ResetInputs: Mutation<RootState>
}

export const mutations: MutationTree<RootState> & RootMutations = {
    Reset(state: RootState) {
        Object.assign(state, emptyState);
        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
    },

    ResetInputs(state: RootState) {
        Object.assign(state.surveyAndProgram, emptyState.surveyAndProgram);
        Object.assign(state.filteredData, emptyState.filteredData);
        state.surveyAndProgram.ready = true;
    }
};
