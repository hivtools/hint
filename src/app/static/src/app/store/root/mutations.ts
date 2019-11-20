import {Mutation, MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";
import {initialSurveyAndProgramDataState} from "../surveyAndProgram/surveyAndProgram";
import {initialFilteredDataState} from "../filteredData/filteredData";

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
        Object.assign(state.surveyAndProgram, initialSurveyAndProgramDataState());
        Object.assign(state.filteredData, initialFilteredDataState());
        state.surveyAndProgram.ready = true;
    }
};
