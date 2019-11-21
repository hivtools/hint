import {FilterOption} from "../../generated";
import {localStorageManager} from "../../localStorageManager";
import {Module} from "vuex";
import {RootState} from "../../root";
import {mutations} from "./mutations";

export interface PlottingSelectionsState {
    barchart: BarchartSelections
}

export interface BarchartSelections {
    indicatorId: string,
    xAxisId: string,
    disaggregateById: string,
    selectedFilterOptions:  { [key: string]: FilterOption[] }
}

export const initialBarchartSelections = (): BarchartSelections => {
    return {
        indicatorId: "",
        xAxisId: "",
        disaggregateById: "",
        selectedFilterOptions: {}
    }
};

export const initialPlottingSelectionsState = (): PlottingSelectionsState => {
    return {
        barchart: initialBarchartSelections()
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const plottingSelections: Module<PlottingSelectionsState, RootState> = {
    namespaced,
    state: {...initialPlottingSelectionsState(), ...existingState && existingState.plottingSelections},
    mutations
};

