import {IndicatorValuesDict} from "../../types";
import {IndicatorMetadata} from "../../generated";
import {flattenIds, getColor} from "../../store/filteredData/utils";
import {RootState} from "../../root";
import {DataType, FilteredDataState} from "../../store/filteredData/filteredData";

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

export const flattenedSelectedRegionFilters = (rootState: RootState): Set<string> => {
    const filterState = rootState.filteredData;
    const selectedRegions = filterState.selectedChoroplethFilters.regions || [];
    return flattenIds(selectedRegions, rootState.baseline.flattenedRegionFilters);
};

const excludeRow = (state: RootState, selectedRegions: Set<string>, row: any): boolean => {
    const filterState = state.filteredData;
    const dataType = filterState.selectedDataType!!;
    const selectedFilters = filterState.selectedChoroplethFilters;

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

    if (selectedRegions.size > 0 && !selectedRegions.has(row.area_id)) {
        return true
    }

    return false;
};

export const getRegionIndicators = (state: RootState, metadata: IndicatorMetadata): IndicatorValuesDict => {

    const filterState = state.filteredData;
    const data = getUnfilteredData(filterState, state);
    if (!data || (filterState.selectedDataType == null)) {
        return {};
    }

    const result = {} as IndicatorValuesDict;
    const selectedRegionIds = flattenedSelectedRegionFilters(state);

    for (const row of data) {

        if (excludeRow(state, selectedRegionIds, row)) {
            continue;
        }

        const areaId: string = row.area_id;

        if (metadata.indicator_column && metadata.indicator_value != row[metadata.indicator_column]) {
            //This data is in long format, and the indicator column's value does not match that for this indicator
            continue;
        }

        if (row[metadata.value_column] === undefined) {
            //No value for this indicator in this row
            continue;
        }

        const value = row[metadata.value_column];

        result[areaId] = {
            value: value,
            color: getColor(value, metadata)
        }
    }

    return result;
};
