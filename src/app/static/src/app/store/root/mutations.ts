import {Mutation, MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";
import {initialFilteredDataState} from "../filteredData/filteredData";
import {initialModelOptionsState} from "../modelOptions/modelOptions";
import {initialModelRunState} from "../modelRun/modelRun";
import {initialModelOutputState} from "../modelOutput/modelOutput";

export interface RootMutations {
    Reset: Mutation<RootState>
    ResetInputs: Mutation<RootState>
}

export const mutations: MutationTree<RootState> & RootMutations = {
    Reset(state: RootState) {

        Object.assign(state, emptyState());

        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
    },

    ResetInputs(state: RootState) {
        Object.assign(state.filteredData, initialFilteredDataState());
    },

    ResetOptions(state: RootState) {
        Object.assign(state.modelOptions, initialModelOptionsState());
    },

    ResetOutputs(state: RootState) {
        Object.assign(state.modelRun, initialModelRunState());
        state.modelRun.ready = true;
        Object.assign(state.modelOutput, initialModelOutputState());
    }

};
