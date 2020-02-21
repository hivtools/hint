import {Mutation, MutationTree} from 'vuex';
import {
    PlottingSelectionsState,
    BarchartSelections,
    BubblePlotSelections,
    ChoroplethSelections
} from "./plottingSelections";
import {PayloadWithType} from "../../types";

type PlottingSelectionsMutation = Mutation<PlottingSelectionsState>

export interface PlottingSelectionsMutations {
    updateBarchartSelections: PlottingSelectionsMutation,
    updateBubblePlotSelections: PlottingSelectionsMutation,
    updateSAPChoroplethSelections: PlottingSelectionsMutation
}

export const mutations: MutationTree<PlottingSelectionsState> & PlottingSelectionsMutations = {
    updateBarchartSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<BarchartSelections>>) {
        state.barchart = {...state.barchart, ...action.payload};
    },
    updateBubblePlotSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<BubblePlotSelections>>) {
        state.bubble = {...state.bubble, ...action.payload};
    },
    updateSAPChoroplethSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<ChoroplethSelections>>) {
        state.sapChoropleth = {...state.sapChoropleth, ...action.payload}
    }
};