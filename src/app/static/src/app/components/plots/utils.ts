import {Dict, IndicatorValuesDict} from "../../types";
import {FilterOption, IndicatorMetadata, NestedFilterOption} from "../../generated";
import {flattenIds, flattenOptions, getColor, getUnfilteredData} from "../../store/filteredData/utils";
import {RootState} from "../../root";
import {DataType} from "../../store/filteredData/filteredData";

export const CachedRegions = {
    countryName: "",
    flattenedRegions: {},
    selectedRegions: [],

    getAll(state: RootState) {
        if (state.baseline.country != this.countryName) {
            this.countryName = state.baseline.country;
            this.flattenedRegions = Object.freeze(getFlattenedRegions(state));
        }
        return this.flattenedRegions;
    },

    getSelected(state: RootState) {
        return flattenedSelectedRegionFilters(state, this.getAll(state));
    }
};

const getFlattenedRegions = (state: RootState): Dict<NestedFilterOption> => {
    const shape = state.baseline && state.baseline.shape;
    let regions: NestedFilterOption[] = [];
    if (shape && shape.filters.regions && shape.filters.regions.children) {
        regions = shape.filters.regions.children as NestedFilterOption[]
    }

    return Object.freeze(flattenOptions(regions));
};

const excludeRow = (state: RootState, regions: Dict<any> | null, row: any): boolean => {
    const filterState = state.filteredData;
    const dataType = filterState.selectedDataType;
    const selectedFilters = filterState.selectedChoroplethFilters;

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

    if (regions && !regions[row.area_id]) {
        return true
    }

    return false;
};

const flattenedSelectedRegionFilters = (state: RootState, allOptions: Dict<FilterOption>): Dict<FilterOption> | null => {
    const filterState = state.filteredData;
    const selectedRegions = filterState.selectedChoroplethFilters.regions || [];
    if (selectedRegions.length == 0)
    {
        return null;
    }
    return flattenIds(selectedRegions, allOptions);
};

export const getRegionIndicators = (state: RootState, metadata: IndicatorMetadata): IndicatorValuesDict => {

    const filterState = state.filteredData;
    const data = getUnfilteredData(filterState, state);
    if (!data || (filterState.selectedDataType == null)) {
        return {};
    }

    const result = {} as IndicatorValuesDict;
    const selectedRegionIds = CachedRegions.getSelected(state);

    for (const row of data) {

        if (excludeRow(state, selectedRegionIds, row)) {
            continue;
        }

        const areaId: string = row.area_id;

        // TODO get selected indicator from store

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

    return Object.freeze(result);
};
