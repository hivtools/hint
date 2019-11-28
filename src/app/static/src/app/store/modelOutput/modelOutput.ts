import {Module} from "vuex";
import {RootState} from "../../root";
import {BarchartIndicator, Filter} from "../../types";
import {FilterOption} from "../../generated";
import {mutations} from "./mutations";
import {initialModelRunState} from "../modelRun/modelRun";
import {localStorageManager} from "../../localStorageManager";

const namespaced: boolean = true;

export interface ModelOutputState {
    selectedTab: string
}

export const modelOutputGetters = {
    barchartIndicators: (state: ModelOutputState, getters: any, rootState: RootState): BarchartIndicator[] => {
        return rootState.modelRun.result!!.plottingMetadata.barchart.indicators;
    },
    barchartFilters: (state: ModelOutputState, getters: any, rootState: RootState): Filter[] => {

        let filters = [...rootState.modelRun.result!!.plottingMetadata.barchart.filters];

        const area = filters.find((f: any) => f.id == "area");
        if (area && area.use_shape_regions) {
            const regions: FilterOption[] = rootState.baseline.shape!!.filters!!.regions ?
                [rootState.baseline.shape!!.filters!!.regions] : [];

            //remove old, frozen area filter, add new one with regions from shape
            filters = [
                {...area, options: regions},
                ...filters.filter((f: any) => f.id != "area")
            ];
        }

        return [
            ...filters
        ];
    }
};

export const initialModelOutputState = (): ModelOutputState => {
    return {
        selectedTab: ""
    }
};

const existingState = localStorageManager.getState();

export const modelOutput: Module<ModelOutputState, RootState> = {
    namespaced,
    state: {...initialModelOutputState(), ...existingState && existingState.modelOutput},
    getters: modelOutputGetters,
    mutations
};
