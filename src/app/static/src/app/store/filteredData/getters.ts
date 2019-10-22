import {RootState} from "../../root";
import {DataType, FilteredDataState, SelectedChoroplethFilters, SelectedFilters} from "./filteredData";

import {IndicatorMetadata, NestedFilterOption} from "../../generated";
import {IndicatorValues, IndicatorValuesDict} from "../../types";
import {Dict} from "../../types";
import {FilterOption} from "../../generated";
import {flattenOptions} from "./utils";
import {getColor, getUnfilteredData, sexFilterOptions} from "./utils";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import {Indicators} from "../../../tests/mocks";

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState): Dict<FilterOption[] | undefined> | null => {
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
    regionOptions: (state: FilteredDataState, getters: any, rootState: RootState): NestedFilterOption[] => {
        const shape = rootState.baseline && rootState.baseline.shape;
        if (!shape || !shape.filters.regions || !shape.filters.regions.children)
            return [];

        //We're skipping the top level, country region as it doesn't really contribute to the filtering
        return shape.filters.regions.children as NestedFilterOption[];
    },
    regionIndicators: function (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any): Dict<IndicatorValuesDict> {

        const data = getUnfilteredData(state, rootState);
        if (!data || (state.selectedDataType == null)) {
            return {};
        }

        const flattenedRegions = getters.flattenedSelectedRegionFilters;
        const result = {} as Dict<IndicatorValuesDict>;

        const indicatorsMeta = rootGetters['metadata/choroplethIndicatorsMetadata'];

        for (const row of data) {

            if (getters.excludeRow(row)) {
                continue;
            }

            const areaId: string = row.area_id;

            for (const metadata of indicatorsMeta) {

                const indicator = metadata.indicator;

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
                    result[areaId] = {} as IndicatorValuesDict;
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
    excludeRow: function (state: FilteredDataState, getters: any): (row: any) => boolean {
        const dataType = state.selectedDataType;
        const selectedFilters = state.selectedChoroplethFilters;
        const selectedRegionFilters = getters.flattenedSelectedRegionFilters;

        return (row: any) => {

            if (dataType == null) {
                return true;
            }

            if (dataType != DataType.ANC && row.sex != selectedFilters.sex!.id) {
                return true;
            }

            if (dataType != DataType.ANC && row.age_group_id != selectedFilters.age!.id) {
                return true;
            }

            if (dataType == DataType.Survey && row.survey_id != selectedFilters.survey!.id) {
                return true;
            }

            if (dataType in [DataType.Program, DataType.ANC] && row.quarter_id != selectedFilters.quarter!.id) {
                return true;
            }

            const flattenedRegionIds = Object.keys(selectedRegionFilters);
            if (flattenedRegionIds.length && flattenedRegionIds.indexOf(row.area_id) < 0) {
                return true
            }

            return false;
        }
    },
    flattenedRegionOptions: function (state: FilteredDataState, getters: any): Dict<NestedFilterOption> {
        return flattenOptions(getters.regionOptions);
    },
    flattenedSelectedRegionFilters: function (state: FilteredDataState): Dict<NestedFilterOption> {
        const selectedRegions = state.selectedChoroplethFilters.regions ? state.selectedChoroplethFilters.regions : [];
        return flattenOptions(selectedRegions);
    },
};

