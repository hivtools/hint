import {Mutation, MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";

export interface RootMutations {
    Reset: Mutation<RootState>
    ResetInputs: Mutation<RootState>
}

export const mutations: MutationTree<RootState> & RootMutations = {
    Reset(state: RootState) {
        Object.keys(state).forEach(key => {
            if (state.hasOwnProperty(key)) {
                // @ts-ignore
                Object.assign(state[key], emptyState[key])
            }
        });
        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
    },

    ResetInputs(state: RootState) {
        Object.assign(state.filteredData, emptyState.filteredData);
    },

    ResetOptions(state: RootState) {
        Object.assign(state.modelOptions, emptyState.modelOptions);
    },

    ResetOutputs(state: RootState) {
        Object.assign(state.modelRun, emptyState.modelRun);
        state.modelRun.ready = true;
        Object.assign(state.modelOutput, emptyState.modelOutput);
    }

};
