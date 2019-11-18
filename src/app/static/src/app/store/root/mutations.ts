import {Mutation, MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";

export interface RootMutations {
    Reset: Mutation<RootState>
    ResetSteps: Mutation<RootState>
}

export const mutations: MutationTree<RootState> & RootMutations = {
    Reset(state: RootState) {
        Object.assign(state, emptyState);
        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
    },

    ResetSteps(state: RootState, fromStep: number) {
        switch (fromStep) {
            case 3:
                Object.assign(state.modelRun, emptyState.modelRun);
                state.modelRun.ready = true;
                Object.assign(state.modelOutput, emptyState.modelOutput);
            case 2:
                Object.assign(state.modelOptions, emptyState.modelOptions);
            case 1:
                Object.assign(state.surveyAndProgram, emptyState.surveyAndProgram);
                Object.assign(state.filteredData, emptyState.filteredData);
                state.surveyAndProgram.ready = true;
        }
    }
};
