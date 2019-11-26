import {Module} from "vuex";
import {RootState} from "../../root";
import {BarchartIndicator, Filter} from "../../types";
import {FilterOption} from "../../generated";

const namespaced: boolean = true;

export interface ModelOutputState {
    dummyProperty: boolean // unused except for testing
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
            filters = filters.filter((f: any) => f.id != "area");
            filters.push({...area, options: regions})
        }

        return [
            ...filters
        ];
    }
};

export const initialModelOutputState = (): ModelOutputState => {
    return {
        dummyProperty: false
    }
};

export const modelOutput: Module<ModelOutputState, RootState> = {
    namespaced,
    state: initialModelOutputState(),
    getters: modelOutputGetters
};
