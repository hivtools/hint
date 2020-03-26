import {Mutation, MutationTree} from 'vuex';
import {
    PlottingSelectionsState,
    BarchartSelections,
    BubblePlotSelections,
    ChoroplethSelections, ColourScaleSelections, ColourScalesState
} from "./plottingSelections";
import {PayloadWithType} from "../../types";
import {DataType} from "../surveyAndProgram/surveyAndProgram";

type PlottingSelectionsMutation = Mutation<PlottingSelectionsState>

export interface PlottingSelectionsMutations {
    updateBarchartSelections: PlottingSelectionsMutation,
    updateBubblePlotSelections: PlottingSelectionsMutation,
    updateSAPChoroplethSelections: PlottingSelectionsMutation,
    updateOutputChoroplethSelections: PlottingSelectionsMutation,
    updateSAPColourScales: PlottingSelectionsMutation,
    updateOutputColourScales: PlottingSelectionsMutation
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
    },
    updateOutputChoroplethSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<ChoroplethSelections>>) {
        state.outputChoropleth = {...state.outputChoropleth, ...action.payload}
    },
    updateSAPColourScales(state: PlottingSelectionsState, action: PayloadWithType<[DataType, ColourScaleSelections]>) {
        const value = action.payload[1];
        switch(action.payload[0]) {
            case DataType.Survey:
                state.colourScales.survey = value;
                break;
            case DataType.ANC:
                state.colourScales.anc = value;
                break;
            case DataType.Program:
                state.colourScales.program = value;
                break;
            default:

        }
    },
    updateOutputColourScales(state: PlottingSelectionsState, action: PayloadWithType<ColourScaleSelections>) {
        state.colourScales.output = action.payload;
    }
};