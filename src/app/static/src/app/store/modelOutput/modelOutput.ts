import {Module} from "vuex";
import {RootState} from "../../root";
import {BarchartIndicator, Filter} from "../../types";
import {FilterOption} from "../../generated";

const namespaced: boolean = true;

export interface ModelOutputState {}

export const modelOutputGetters = {
    barchartIndicators: (state: ModelOutputState, getters: any, rootState: RootState): BarchartIndicator[] => {
        return rootState.modelRun.result!!.plottingMetadata.barchart.indicators;
    },
    barchartFilters: (state: ModelOutputState, getters: any, rootState: RootState): Filter[] => {
        const regions: FilterOption[] = rootState.baseline.shape!!.filters!!.regions ?
                                        [rootState.baseline.shape!!.filters!!.regions] : [];

        return [
            ...rootState.modelRun.result!!.plottingMetadata.barchart.filters,
            {
                "id": "region",
                "column_id": "area_id",
                "label": "Region",
                "options": regions
            }
        ];
    }
};

export const modelOutput: Module<ModelOutputState, RootState> = {
    namespaced,
    state: {},
    getters: modelOutputGetters
};