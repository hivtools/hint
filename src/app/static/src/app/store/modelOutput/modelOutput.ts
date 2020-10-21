import {Module} from "vuex";
import {RootState} from "../../root";
import {BarchartIndicator, Filter, DisplayFilter} from "../../types";
import {ChoroplethIndicatorMetadata, FilterOption} from "../../generated";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {rootOptionChildren} from "../../utils";

const namespaced = true;

export interface ModelOutputState {
    selectedTab: string
}

export const modelOutputGetters = {
    barchartIndicators: (state: ModelOutputState, getters: any, rootState: RootState): BarchartIndicator[] => {
        return rootState.modelRun.result!.plottingMetadata.barchart.indicators;
    },
    barchartFilters: (state: ModelOutputState, getters: any, rootState: RootState): Filter[] => {
        return outputPlotFilters(rootState);
    },
    bubblePlotIndicators: (state: ModelOutputState, getters: any, rootState: RootState, rootGetters: any): ChoroplethIndicatorMetadata[] => {
        return rootGetters['metadata/outputIndicatorsMetadata'];
    },
    bubblePlotFilters: (state: ModelOutputState, getters: any, rootState: RootState, rootGetters: any): Filter[] => {
        return  outputPlotFilters(rootState);
    },
    choroplethIndicators: (state: ModelOutputState, getters: any, rootState: RootState, rootGetters: any): ChoroplethIndicatorMetadata[] => {
        return rootGetters['metadata/outputIndicatorsMetadata'];
    },
    choroplethFilters: (state: ModelOutputState, getters: any, rootState: RootState, rootGetters: any): DisplayFilter[] => {
        const outputFilters =  outputPlotFilters(rootState) as Filter[];
        const areaId = "area";
        return  outputFilters.map(f => {
            return {
                ...f,
                allowMultiple: f.id == areaId,
                options: f.id == areaId ? rootOptionChildren(f.options) : f.options
            }
        });
    },
    countryAreaFilterOption: (state: ModelOutputState, getters: any, rootState: RootState, rootGetters: any): FilterOption => {
      const outputFilters =  outputPlotFilters(rootState) as Filter[];
      return  outputFilters[0].options[0]
    }
};

const outputPlotFilters = (rootState: RootState) => {
    let filters =  [...rootState.modelRun.result!.plottingMetadata.barchart.filters];
    const area = filters.find((f: any) => f.id == "area");
    if (area && area.use_shape_regions) {
        const regions: FilterOption[] = rootState.baseline.shape!.filters!.regions ?
            [rootState.baseline.shape!.filters!.regions] : [];

        //remove old, frozen area filter, add new one with regions from shape
        filters = [
            {...area, options: regions},
            ...filters.filter((f: any) => f.id != "area")
        ];
    }

    return [
        ...filters
    ];
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
