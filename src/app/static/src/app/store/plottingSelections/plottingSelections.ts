import {FilterOption} from "../../generated";
import {localStorageManager} from "../../localStorageManager";
import {Module} from "vuex";
import {RootState} from "../../root";
import {mutations} from "./mutations";
import {Dict} from "../../types";

export interface PlottingSelectionsState {
    barchart: BarchartSelections,
    bubble: BubblePlotSelections,
    sapChoropleth: ChoroplethSelections,
    outputChoropleth: ChoroplethSelections
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

export const initialPlottingSelectionsState = (): PlottingSelectionsState => {
    return {
        barchart: initialBarchartSelections(),
        bubble: initialBubblePlotSelections(),
        sapChoropleth: initialChorplethSelections(),
        outputChoropleth: initialChorplethSelections()
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const plottingSelections: Module<PlottingSelectionsState, RootState> = {
    namespaced,
    state: {...initialPlottingSelectionsState(), ...existingState && existingState.plottingSelections},
    mutations
};

