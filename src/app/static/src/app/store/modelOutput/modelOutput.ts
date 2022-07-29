import {Module} from "vuex";
import {RootState} from "../../root";
import {BarchartIndicator, DisplayFilter, Filter} from "../../types";
import {ChoroplethIndicatorMetadata, FilterOption} from "../../generated";
import {mutations} from "./mutations";
import {rootOptionChildren} from "../../utils";

const namespaced = true;

export interface ModelOutputState {
    selectedTab: string
}

export const modelOutputGetters = {
    barchartIndicators: (state: ModelOutputState, getters: any, rootState: RootState): BarchartIndicator[] => {
        return rootState.modelCalibrate.result!.plottingMetadata.barchart.indicators;
    },
    comparisonPlotIndicators: (state: ModelOutputState, getters: any, rootState: RootState): BarchartIndicator[] => {
        return rootState.modelCalibrate.comparisonPlotResult ? rootState.modelCalibrate.comparisonPlotResult.plottingMetadata.barchart.indicators : [];
    },
    barchartFilters: (state: ModelOutputState, getters: any, rootState: RootState): Filter[] => {
        return outputPlotFilters(rootState);
    },
    comparisonPlotFilters: (state: ModelOutputState, getters: any, rootState: RootState): Filter[] => {
        return outputPlotFilters(rootState, "comparisonPlotResult");
    },
    bubblePlotIndicators: (state: ModelOutputState, getters: any, rootState: RootState): ChoroplethIndicatorMetadata[] => {
        return rootState.modelCalibrate.result!.plottingMetadata.choropleth.indicators;
    },
    bubblePlotFilters: (state: ModelOutputState, getters: any, rootState: RootState): Filter[] => {
        return outputPlotFilters(rootState);
    },
    choroplethIndicators: (state: ModelOutputState, getters: any, rootState: RootState): ChoroplethIndicatorMetadata[] => {
        return rootState.modelCalibrate.result!.plottingMetadata.choropleth.indicators;
    },
    choroplethFilters: (state: ModelOutputState, getters: any, rootState: RootState, rootGetters: any): DisplayFilter[] => {
        const outputFilters = outputPlotFilters(rootState) as Filter[];
        const areaId = "area";
        return outputFilters.map(f => {
            return {
                ...f,
                allowMultiple: f.id == areaId,
                options: f.id == areaId ? rootOptionChildren(f.options) : f.options
            }
        });
    },
    countryAreaFilterOption: (state: ModelOutputState, getters: any, rootState: RootState, rootGetters: any): FilterOption => {
        const outputFilters = outputPlotFilters(rootState) as Filter[];
        return outputFilters[0].options[0]
    }
};

const outputPlotFilters = (rootState: RootState, resultName: "result" | "comparisonPlotResult" = "result") => {
    let filters = [...rootState.modelCalibrate[resultName]!.plottingMetadata?.barchart.filters];
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

// const comparisonPlotFilters = (rootState: RootState) => {
//     let filters = [...rootState.modelCalibrate.comparisonPlotResult!.plottingMetadata?.barchart.filters];
//     const area = filters.find((f: any) => f.id == "area");
//     if (area && area.use_shape_regions) {
//         const regions: FilterOption[] = rootState.baseline.shape!.filters!.regions ?
//             [rootState.baseline.shape!.filters!.regions] : [];

//         //remove old, frozen area filter, add new one with regions from shape
//         filters = [
//             {...area, options: regions},
//             ...filters.filter((f: any) => f.id != "area")
//         ];
//     }

//     return [
//         ...filters
//     ];
// };

export const initialModelOutputState = (): ModelOutputState => {
    return {
        selectedTab: ""
    }
};

export const modelOutput = (existingState: Partial<RootState> | null): Module<ModelOutputState, RootState> => {
    return {
        namespaced,
        state: {...initialModelOutputState(), ...existingState && existingState.modelOutput},
        getters: modelOutputGetters,
        mutations
    };
};
