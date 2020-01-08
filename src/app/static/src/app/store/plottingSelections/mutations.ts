import {Mutation, MutationTree} from 'vuex';
import {PlottingSelectionsState, BarchartSelections, BubblePlotSelections} from "./plottingSelections";
import {PayloadWithType} from "../../types";

type PlottingSelectionsMutation = Mutation<PlottingSelectionsState>

export interface PlottingSelectionsMutations {
    updateBarchartSelections: PlottingSelectionsMutation,
    updateBubblePlotSelections: PlottingSelectionsMutation
}

export const mutations: MutationTree<PlottingSelectionsState> & PlottingSelectionsMutations = {
    updateBarchartSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<BarchartSelections>>) {
        state.barchart = {...state.barchart, ...action.payload};
    },
    updateBubblePlotSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<BubblePlotSelections>>) {
        state.bubble = {...state.bubble, ...action.payload};
    }
};