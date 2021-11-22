import {Mutation, MutationTree} from 'vuex';
import {
    PlottingSelectionsState,
    BarchartSelections,
    BubblePlotSelections,
    ChoroplethSelections, ScaleSelections, ColourScalesState
} from "./plottingSelections";
import {PayloadWithType, Dict} from "../../types";
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
    updateBarchartSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<BarchartSelections>>) {
        // Some concerns regarding computational efficiency and mutating state
        const { xAxisId, selectedFilterOptions } = action.payload
        // finds the filter options of the selected xAxis variable in the barchart filters getter
        let originalFilterOptionsOrder: NestedFilterOption[] | undefined = modelOutputGetters
            .barchartFilters({} as any, {}, storeOptions.state as RootState)
            .find(filter => filter.id === xAxisId)?.options
        // if the above has nested children (ie, if xAxis is area), flatten the array
        if (originalFilterOptionsOrder && originalFilterOptionsOrder[0].children){
            const flattenedOptions = flattenOptions(originalFilterOptionsOrder)
            originalFilterOptionsOrder = []
            Object.keys(flattenedOptions).map(function(key, index) {
                originalFilterOptionsOrder?.push(flattenedOptions[key])
            })
        }
        // maps through the getter array to get the original order and returns only the selected filters
        const updatedFilterOption: FilterOption[] = []
        if (originalFilterOptionsOrder && xAxisId && selectedFilterOptions && selectedFilterOptions[xAxisId]) {
            originalFilterOptionsOrder.map(option => {
                selectedFilterOptions[xAxisId]
                    .some(option2 => option2.id === option.id) && updatedFilterOption.push(option)
            })
            const update = {...state.barchart, ...action.payload}
            update.selectedFilterOptions[xAxisId] = updatedFilterOption
            state.barchart = update
        // if unable to do the above, just updates the barchart as normal
        } else {
            state.barchart = {...state.barchart, ...action.payload};
        }
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
