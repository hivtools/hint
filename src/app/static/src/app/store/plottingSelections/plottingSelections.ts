import {FilterOption} from "../../generated";
import {localStorageManager} from "../../localStorageManager";
import {Module} from "vuex";
import {RootState} from "../../root";
import {mutations} from "./mutations";
import {getters} from "./getters";
import {Dict} from "../../types";

export interface PlottingSelectionsState {
    barchart: BarchartSelections,
    bubble: BubblePlotSelections,
    sapChoropleth: ChoroplethSelections,
    outputChoropleth: ChoroplethSelections,
    colourScales: ColourScalesState
}

export interface BarchartSelections {
    indicatorId: string,
    xAxisId: string,
    disaggregateById: string,
    selectedFilterOptions:  Dict<FilterOption[]>

}

export interface BubblePlotSelections {
    colorIndicatorId: string,
    sizeIndicatorId: string,
    selectedFilterOptions: Dict<FilterOption[]>,
    detail: number
}

export interface ChoroplethSelections {
    indicatorId: string,
    selectedFilterOptions: Dict<FilterOption[]>,
    detail: number
}

export interface ColourScalesState {
    survey: ColourScaleSelections,
    anc: ColourScaleSelections,
    program: ColourScaleSelections,
    output: ColourScaleSelections
}

export enum ColourScaleType {Default, Custom}

export type ColourScaleSelections = Dict<ColourScaleSettings>;

export interface ColourScaleSettings {
    type: ColourScaleType
    customMin: number,
    customMax: number
}

export const initialBarchartSelections = (): BarchartSelections => {
    return {
        indicatorId: "",
        xAxisId: "",
        disaggregateById: "",
        selectedFilterOptions: {}
    }
};

export const initialBubblePlotSelections = (): BubblePlotSelections => {
    return {
        colorIndicatorId: "",
        sizeIndicatorId: "",
        selectedFilterOptions: {},
        detail: -1
    };
};

export const initialChorplethSelections = (): ChoroplethSelections => {
    return {
        indicatorId: "",
        selectedFilterOptions: {},
        detail: -1
    };
};

export const initialColourScaleSettings = (): ColourScaleSettings => {
    return {
        type: ColourScaleType.Default,
        customMin: 0,
        customMax: 0
    }
};

export const initialColourScalesState = (): ColourScalesState => {
    return {
        survey: {},
        anc: {},
        program: {},
        output: {}
    }
};

export const initialPlottingSelectionsState = (): PlottingSelectionsState => {
    return {
        barchart: initialBarchartSelections(),
        bubble: initialBubblePlotSelections(),
        sapChoropleth: initialChorplethSelections(),
        outputChoropleth: initialChorplethSelections(),
        colourScales: initialColourScalesState()
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const plottingSelections: Module<PlottingSelectionsState, RootState> = {
    namespaced,
    state: {...initialPlottingSelectionsState(), ...existingState && existingState.plottingSelections},
    mutations,
    getters
};


