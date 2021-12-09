import {Mutation, MutationTree} from 'vuex';
import {
    PlottingSelectionsState,
    BarchartSelections,
    BubblePlotSelections,
    ChoroplethSelections, ScaleSelections
} from "./plottingSelections";
import {PayloadWithType} from "../../types";
import {DataType} from "../surveyAndProgram/surveyAndProgram";
import {FilterOption, NestedFilterOption} from "../../generated";
import { modelOutputGetters } from '../modelOutput/modelOutput';
import { storeOptions, RootState } from "../../root"
import { flattenOptions } from "../../utils"

type PlottingSelectionsMutation = Mutation<PlottingSelectionsState>

export interface PlottingSelectionsMutations {
    updateCalibratePlotSelections: PlottingSelectionsMutation,
    updateBarchartSelections: PlottingSelectionsMutation,
    updateBubblePlotSelections: PlottingSelectionsMutation,
    updateSAPChoroplethSelections: PlottingSelectionsMutation,
    updateOutputChoroplethSelections: PlottingSelectionsMutation,
    updateSAPColourScales: PlottingSelectionsMutation,
    updateOutputColourScales: PlottingSelectionsMutation,
    updateOutputBubbleSizeScales: PlottingSelectionsMutation
}

export const mutations: MutationTree<PlottingSelectionsState> & PlottingSelectionsMutations = {
    updateCalibratePlotSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<BarchartSelections>>) {
        state.calibratePlot = {...state.calibratePlot, ...action.payload};
    },
    updateBarchartSelections(state: PlottingSelectionsState, action: PayloadWithType<BarchartSelections>) {
        console.log("action", action)
        // const { xAxisId, selectedFilterOptions } = action.payload
        // if (xAxisId && selectedFilterOptions && selectedFilterOptions[xAxisId]){
        //     console.log("here")
            
        //     // finds the filter options of the selected xAxis variable in the barchart filters getter
        //     let originalFilterOptionsOrder: NestedFilterOption[] | undefined = modelOutputGetters
        //         .barchartFilters({} as any, {}, storeOptions.state as RootState)
        //         .find(filter => filter.id === xAxisId)?.options
        //     console.log("originalFilterOptionsOrder", originalFilterOptionsOrder)

        //     // Get the list of filter option ids in their configured order, whether nested or not
        //     let originalFilterOptionsIds: string[];
        //     if (originalFilterOptionsOrder && originalFilterOptionsOrder[0].children){
        //         const flattenedOptions = flattenOptions(originalFilterOptionsOrder)
        //         originalFilterOptionsIds = Object.keys(flattenedOptions)
        //     } else if (originalFilterOptionsOrder) {
        //         originalFilterOptionsIds = originalFilterOptionsOrder.map((option: FilterOption) => option.id);
        //     }

        //     // Sort the selected filter values according to configured order
        //     if (originalFilterOptionsOrder) {
        //         const updatedFilterOptions = [...selectedFilterOptions[xAxisId]].sort((a: FilterOption, b: FilterOption) => {
        //             return originalFilterOptionsIds.indexOf(a.id) - originalFilterOptionsIds.indexOf(b.id);
        //         });

        //         const update = {...state.barchart, ...action.payload}
        //         update.selectedFilterOptions[xAxisId] = updatedFilterOptions
        //         state.barchart = update
        //         return;
        //     }
        // }
        
        // if unable to do the above, just updates the barchart as normal
        // state.barchart = {...state.barchart, ...action.payload};
        state.barchart = action.payload
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
    updateSAPColourScales(state: PlottingSelectionsState, action: PayloadWithType<[DataType, ScaleSelections]>) {
        const value = action.payload[1];
        switch (action.payload[0]) {
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
    updateOutputColourScales(state: PlottingSelectionsState, action: PayloadWithType<ScaleSelections>) {
        state.colourScales.output = action.payload;
    },
    updateOutputBubbleSizeScales(state: PlottingSelectionsState, action: PayloadWithType<ScaleSelections>) {
        state.bubbleSizeScales.output = action.payload;
    }
};
