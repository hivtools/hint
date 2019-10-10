import {RootState} from "../../root";
import {DataType, FilteredDataState, SelectedChoroplethFilters} from "./filteredData";
import {IndicatorRange, IndicatorValues} from "../../types";
import * as d3 from "d3-scale-chromatic";
import {Indicator, NestedFilterOption} from "../../generated";
import {Dictionary} from "vuex";

const sexFilterOptions = [
    {id: "both", name: "both"},
    {id: "female", name: "female"},
    {id: "male", name: "male"}
];

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const sapState = rootState.surveyAndProgram;
        const regions = getters.regionOptions;
        switch (state.selectedDataType) {
            case (DataType.ANC):
                return sapState.anc ?
                    {
                        ...sapState.anc.filters,
                        regions,
                        sex: undefined,
                        surveys: undefined
                    } : null;
            case (DataType.Program):
                return sapState.program ?
                    {
                        ...sapState.program.filters,
                        regions,
                        sex: sexFilterOptions,
                        surveys: undefined
                    } : null;
            case (DataType.Survey):
                return sapState.survey ?
                    {
                        ...sapState.survey.filters,
                        regions,
                        sex: sexFilterOptions,
                        quarter: undefined
                    } : null;
            case (DataType.Output):
                return rootState.modelRun.result ?
                    {
                        ...rootState.modelRun.result.filters,
                        regions,
                        sex: sexFilterOptions,
                        surveys: undefined
                    } : null;

            default:
                return null;
        }
    },
    regionOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const shape = rootState.baseline && rootState.baseline.shape ? rootState.baseline.shape : null;
        //We're skipping the top level, country region as it doesn't really contribute to the filtering
        return shape && shape.filters &&
        shape.filters.regions &&
        (shape.filters.regions as any).options ? (shape.filters.regions as any).options : null;
    },
    regionIndicators: function (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
        const data = getUnfilteredData(state, rootState);
        if (!data || (state.selectedDataType == null)) {
            return {};
        }

        const result = {} as { [k: string]: Dictionary<IndicatorValues> };

        const flattenedRegions = getters.flattenedSelectedRegionFilters;

        const metadata = rootState.metadata.plottingMetadata!!;
        const indicatorMetadata = metadata[state.selectedDataType!!].choropleth!!.indicators!!;

        for (const row of data) {

            if (!includeRowForSelectedChoroplethFilters(row,
                state.selectedDataType,
                state.selectedChoroplethFilters,
                flattenedRegions)) {
                continue;
            }

            const areaId = row.area_id;

            if (!result[areaId]) {
                result[areaId] = {};
            }

            const indicatorsForArea = result[areaId];
            indicatorMetadata.map((i: Indicator) => {
                const value = row[i.value_column];

                if (!indicatorsForArea[i.id]) {
                    indicatorsForArea[i.id].value = 0;
                }

                indicatorsForArea[i.id].value += value;
                // @ts-ignore
                indicatorsForArea[i.id].color = getColor(value, i.id, d3[i.colour]);
            });
        }
        return result;
    },
    flattenedRegionOptions: function (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
        const options = getters.regionOptions ? getters.regionOptions : [];
        return flattenOptions(options);
    },
    flattenedSelectedRegionFilters: function (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
        const selectedRegions = state.selectedChoroplethFilters.regions ? state.selectedChoroplethFilters.regions : [];
        return flattenOptions(selectedRegions);
    },
    choroplethRanges: function (state: FilteredDataState, getters: any, rootState: RootState): Dictionary<IndicatorRange> {
        const metadata = rootState.metadata.plottingMetadata!!;
        const indicators = metadata[state.selectedDataType!!].choropleth!!.indicators!!;
        const ranges: Dictionary<IndicatorRange> = {};
        indicators.map((i: Indicator) =>
            ranges[i.id] = {
                min: i.min,
                max: i.max,
            }
        );
        return ranges;
    },
    color: function(state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any,
                    value: number, id: number, colorFunction: (t: number) => string) {

        const colorValue = value / getters.choroplethRanges[id];
        return colorFunction(colorValue);
    }

};

const flattenOptions = (filterOptions: NestedFilterOption[]) => {
    let result = {};
    filterOptions.forEach(r =>
        result = {
            ...result,
            ...flattenOption(r)
        });
    return result;
};

const flattenOption = (filterOption: NestedFilterOption) => {
    let result = {} as any;
    result[filterOption.id] = filterOption;
    if (filterOption.options) {
        filterOption.options.forEach(o =>
            result = {
                ...result,
                ...flattenOption(o as NestedFilterOption)
            });

    }
    return result;
};

export const getUnfilteredData = (state: FilteredDataState, rootState: RootState) => {
    const sapState = rootState.surveyAndProgram;
    switch (state.selectedDataType) {
        case (DataType.ANC):
            return sapState.anc ? sapState.anc.data : null;
        case (DataType.Program):
            return sapState.program ? sapState.program.data : null;
        case (DataType.Survey):
            return sapState.survey ? sapState.survey.data : null;
        case (DataType.Output):
            return rootState.modelRun.result ? rootState.modelRun.result.data : null;
        default:
            return null;
    }
};

const includeRowForSelectedChoroplethFilters = (row: any,
                                                dataType: DataType,
                                                selectedFilters: SelectedChoroplethFilters,
                                                flattenedRegionFilters: object) => {

    if (dataType != DataType.ANC && row.sex != selectedFilters.sex!.id) {
        return false;
    }

    if (dataType != DataType.ANC && row.age_group_id != selectedFilters.age!.id) {
        return false;
    }

    if (dataType == DataType.Survey && row.survey_id != selectedFilters.survey!.id) {
        return false;
    }

    if (dataType in [DataType.Program, DataType.ANC] && row.quarter_id != selectedFilters.quarter!.id) {
        return false;
    }

    //TODO: deal with all indicators in output
    if (dataType == DataType.Output && row.indicator_id != 2) { //prevalence
        return false;
    }

    const flattenedRegionIds = Object.keys(flattenedRegionFilters);
    if (flattenedRegionIds.length && flattenedRegionIds.indexOf(row.area_id) < 0) {
        return false
    }

    return true;
};
