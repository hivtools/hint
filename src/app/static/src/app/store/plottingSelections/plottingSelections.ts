import {FilterOption} from "../../generated";
import {localStorageManager} from "../../localStorageManager";
import {Module} from "vuex";
import {RootState, storeOptions} from "../../root";
import {mutations} from "./mutations";
import {getters} from "./getters";
import {Dict} from "../../types";

export interface PlottingSelectionsState {
    calibratePlot: BarchartSelections,
    barchart: BarchartSelections,
    bubble: BubblePlotSelections,
    sapChoropleth: ChoroplethSelections,
    outputChoropleth: ChoroplethSelections,
    colourScales: ColourScalesState,
    bubbleSizeScales: BubbleSizeScalesState
}

export interface BarchartSelections {
    indicatorId: string,
    xAxisId: string,
    disaggregateById: string,
    selectedFilterOptions: Dict<FilterOption[]>

}

export interface UnadjustedBarchartSelections {
    indicator_id: string,
    xAxisId: string,
    disaggregateById: string,
    selected_filter_options: Dict<FilterOption[]>
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
    survey: ScaleSelections,
    anc: ScaleSelections,
    program: ScaleSelections,
    output: ScaleSelections
}

export interface BubbleSizeScalesState {
    output: ScaleSelections
}

export enum ScaleType {Default, Custom, DynamicFull, DynamicFiltered}

export type ScaleSelections = Dict<ScaleSettings>;

export interface ScaleSettings {
    type: ScaleType
    customMin: number,
    customMax: number
}

export const initialCalibratePlotSelections = (): BarchartSelections => {
    return {
        indicatorId: "",
        xAxisId: "",
        disaggregateById: "",
        selectedFilterOptions: {}
    }
};

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

export const initialScaleSettings = (): ScaleSettings => {
    return {
        type: ScaleType.DynamicFiltered,
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


export const initialBubbleSizeScalesState = (): BubbleSizeScalesState => {
    return {
        output: {}
    }
};


export const initialPlottingSelectionsState = (): PlottingSelectionsState => {
    return {
        calibratePlot: initialCalibratePlotSelections(),
        barchart: initialBarchartSelections(),
        bubble: initialBubblePlotSelections(),
        sapChoropleth: initialChorplethSelections(),
        outputChoropleth: initialChorplethSelections(),
        colourScales: initialColourScalesState(),
        bubbleSizeScales: initialBubbleSizeScalesState()
    }
};

export const plottingSelectionsGetters = {
    calibratePlotDefaultSelections: (state: PlottingSelectionsState, getters: any, rootState: RootState): BarchartSelections => {
        return rootState.modelCalibrate.calibratePlotResult!.plottingMetadata.barchart.defaults;
    }
};

const namespaced = true;
const existingState = localStorageManager.getState();

export const plottingSelections: Module<PlottingSelectionsState, RootState> = {
    namespaced,
    state: {...initialPlottingSelectionsState(), ...existingState && existingState.plottingSelections},
    mutations,
    getters: plottingSelectionsGetters
};


