import {Mutation, MutationTree} from 'vuex';
import {PlottingSelectionsState, BarchartSelections} from "./plottingSelections";

type PlottingSelectionsMutation = Mutation<PlottingSelectionsState>

export interface PlottingSelectionsMutations {
    updateBarchartSelections: PlottingSelectionsMutation
}

export const mutations: MutationTree<PlottingSelectionsState> & PlottingSelectionsMutations = {
    updateBarchartSelections(state: PlottingSelectionsState, payload: BarchartSelections) {
        state.barchart = payload;
    }
};