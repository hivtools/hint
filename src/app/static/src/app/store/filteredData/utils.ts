import {IndicatorRange, IndicatorValues} from "../../types";
import {DataType, FilteredDataState, SelectedChoroplethFilters} from "./filteredData";
import {RootState} from "../../root";

export const sexFilterOptions = [
    {id: "both", name: "both"},
    {id: "female", name: "female"},
    {id: "male", name: "male"}
];

export const getColor = (data: IndicatorValues, range: IndicatorRange, colorFunction: (t: number) => string) => {
    let rangeNum = (range.max && (range.max != range.min)) ? //Avoid dividing by zero if only one value...
        range.max - (range.min || 0) :
        1;

    const colorValue = data!.value / rangeNum;

    return colorFunction(colorValue);
};

export const includeRowForSelectedChoroplethFilters = (row: any,
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
