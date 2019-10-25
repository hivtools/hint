import {RootState} from "../../root";
import {DataType, FilteredDataState} from "./filteredData";
import {FilterOption} from "../../generated";
import {Dict, IndicatorValuesDict} from "../../types";
import {flattenIds, getColor, getUnfilteredData, sexFilterOptions} from "./utils";

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState): Dict<FilterOption[] | undefined> | null => {
        const sapState = rootState.surveyAndProgram;
        const regions = rootState.baseline.regionFilters;
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
    regionIndicators: function (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any): Dict<IndicatorValuesDict> {

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

        return result;
    },
    excludeRow: function (state: FilteredDataState, getters: any, rootState: RootState): (row: any) => boolean {
        const dataType = state.selectedDataType!!;
        const selectedFilters = state.selectedChoroplethFilters;
        const selectedRegionFilters = flattenedSelectedRegionFilters(state, rootState);

        return (row: any) => {

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

            if (selectedRegionFilters.size > 0 && !selectedRegionFilters.has(row.area_id)) {
                return true
            }

            return false;
        }
    }
};

export const flattenedSelectedRegionFilters = (state: FilteredDataState, rootState: RootState): Set<string> => {
    const selectedRegions = state.selectedChoroplethFilters.regions ? state.selectedChoroplethFilters.regions : [];
    return flattenIds(selectedRegions, rootState.baseline.flattenedRegionFilters);
};
