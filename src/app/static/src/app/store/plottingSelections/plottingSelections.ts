import {FilterOption} from "../../generated";
import {localStorageManager} from "../../localStorageManager";
import {Module} from "vuex";
import {RootState} from "../../root";
import {mutations} from "./mutations";
import {Dict} from "../../types";

export interface PlottingSelectionsState {
    barchart: BarchartSelections,
    bubble: BubblePlotSelections
}

export interface BarchartSelections {
    indicatorId: string,
    xAxisId: string,
    disaggregateById: string,
    selectedFilterOptions:  Dict<FilterOption[]>

}

export interface BubblePlotSelections {
    //TODO: add indicators
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
        selectedFilterOptions: {},
        detail: -1
    };
};

export const initialPlottingSelectionsState = (): PlottingSelectionsState => {
    return {
        barchart: initialBarchartSelections(),
        bubble: initialBubblePlotSelections()
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const plottingSelections: Module<PlottingSelectionsState, RootState> = {
    namespaced,
    state: {...initialPlottingSelectionsState(), ...existingState && existingState.plottingSelections},
    mutations
};

