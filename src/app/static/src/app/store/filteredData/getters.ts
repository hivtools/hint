import {RootState} from "../../root";
import {DataType, FilteredDataState,} from "./filteredData";

import {FilterOption, NestedFilterOption} from "../../generated";
import {Dict, IndicatorValuesDict} from "../../types";
import {getColor, getUnfilteredData, sexFilterOptions} from "./utils";

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

        console.time("getting indicators");
        const data = getUnfilteredData(state, rootState);
        if (!data || (state.selectedDataType == null)) {
            return {};
        }

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

        console.timeEnd("getting indicators");
        return result;
    },
    excludeRow: function (state: FilteredDataState, getters: any): (row: any) => boolean {
        const dataType = state.selectedDataType;
        const selectedFilters = state.selectedChoroplethFilters;
        const selectedRegionFilterIds = state.selectedChoroplethFilters.regions;

        return (row: any) => {

            if (dataType == null) {
                return true;
            }

            if (dataType != DataType.ANC && row.sex != selectedFilters.sex) {
                return true;
            }

            if (dataType != DataType.ANC && row.age_group_id != selectedFilters.age) {
                return true;
            }

            if (dataType == DataType.Survey && row.survey_id != selectedFilters.survey) {
                return true;
            }

            if (dataType in [DataType.Program, DataType.ANC] && row.quarter_id != selectedFilters.quarter) {
                return true;
            }

            if (selectedRegionFilterIds && selectedRegionFilterIds.indexOf(row.area_id) < 0) {
                return true
            }

            return false;
        }
    },
    // flattenedSelectedRegionFilters: function (state: FilteredDataState): Dict<string | string[]> {
    //     const selectedRegions = state.selectedChoroplethFilters.regions ? state.selectedChoroplethFilters.regions : [];
    //     return flattenOptions(selectedRegions);
    // },
};

