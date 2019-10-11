import {RootState} from "../../root";
import {DataType, FilteredDataState, SelectedChoroplethFilters, SelectedFilters} from "./filteredData";

import * as d3ScaleChromatic from "d3-scale-chromatic";
import {IndicatorMetadata, NestedFilterOption} from "../../generated";
import {IndicatorValues} from "../../types";

const sexFilterOptions = [
    {id: "both", name: "both"},
    {id: "female", name: "female"},
    {id: "male", name: "male"}
];

export const colorFunctionFromName = function(name: string) {
    return (d3ScaleChromatic as any)[name];
};

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const sapState = rootState.surveyAndProgram;
        const regions = getters.regionOptions;
        switch(state.selectedDataType){
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
                    }: null;

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
    regionIndicators: function(state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
        const data = getUnfilteredData(state, rootState);
        if (!data || (state.selectedDataType == null)) {
            return {};
        }

        const result = {} as { [r: string]: {[i: string]: IndicatorValues} };

        const flattenedRegions = getters.flattenedSelectedRegionFilters;

        //TODO: output data doesn't currently conform to plotting metadata, so for now we fake the metadata
        //Use the real metadata for all other data types
        let indicatorsMeta = state.selectedDataType == DataType.Output ?
            {
                art_coverage: {
                    value_column: "mean",
                    indicator_column: "indicator_id",
                    indicator_value: "4",
                    name: "ART coverage",
                    min: 0,
                    max: 1,
                    colour: "interpolateViridis",
                    invert_scale: false
                },
                prevalence: {
                    value_column: "mean",
                    indicator_column: "indicator_id",
                    indicator_value: "2",
                    name: "Prevalence",
                    min: 0,
                    max: 0.5,
                    colour: "interpolateMagma",
                    invert_scale: true
                }
            } :
            rootGetters['metadata/choroplethIndicatorsMetadata'];

        //TODO: ...and here's a workaround for a small bug in the current Survey metadata - 'art' for
        //indicator value, should be 'artcov'
        if (state.selectedDataType == DataType.Survey) {
            indicatorsMeta = {
                ...indicatorsMeta
            };
            indicatorsMeta.art_coverage.indicator_value = "artcov";
        }

        const indicators = Object.keys(indicatorsMeta);

        for(const d of data) {
            const row = d as any;

            if (!includeRowForSelectedChoroplethFilters(row,
                state.selectedDataType,
                state.selectedChoroplethFilters,
                flattenedRegions)) {
                continue;
            }

            const areaId = row.area_id;

            for (const indicator of indicators) {

                const metadata = indicatorsMeta[indicator];

                if (metadata.indicator_column && metadata.indicator_value != row[metadata.indicator_column]) {
                    //This data is in long format, and the indicator column's value does not match that for this indicator
                    continue;
                }

                if (row[metadata.value_column] === undefined) {
                    //No value for this indicator in this row
                    continue;
                }

                const value = row[metadata.value_column];

                if (!result[areaId]) {
                    result[areaId] = {};
                }

                const regionValues = result[areaId];
                regionValues[indicator] = {
                    value: value,
                    color: getColor(value, metadata)
                }

            }
        }

        return result;
    },
    flattenedRegionOptions: function(state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
        const options = getters.regionOptions ? getters.regionOptions : [];
        return flattenOptions(options);
    },
    flattenedSelectedRegionFilters: function(state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) {
        const selectedRegions = state.selectedChoroplethFilters.regions ? state.selectedChoroplethFilters.regions : [];
        return flattenOptions(selectedRegions);
    },
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

const getColor = (value: number, metadata: IndicatorMetadata) => {
    const max = metadata.max;
    const min = metadata.min;
    const colorFunction = colorFunctionFromName(metadata.colour);

    let rangeNum = (max  && (max != min)) ? //Avoid dividing by zero if only one value...
        max - (min || 0) :
        1;

    const colorValue = value / rangeNum;

    //TODO: invert scale
    return colorFunction(colorValue);
};

export const getUnfilteredData = (state: FilteredDataState, rootState: RootState) => {
    const sapState = rootState.surveyAndProgram;
    switch(state.selectedDataType){
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

    const flattenedRegionIds = Object.keys(flattenedRegionFilters);
    if (flattenedRegionIds.length && flattenedRegionIds.indexOf(row.area_id) < 0) {
        return false
    }

    return true;
};
