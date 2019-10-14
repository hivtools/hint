import {IndicatorRange} from "../../types";
import {DataType, FilteredDataState} from "./filteredData";
import {RootState} from "../../root";
import {NestedFilterOption} from "../../generated";

export const sexFilterOptions = [
    {id: "both", name: "both"},
    {id: "female", name: "female"},
    {id: "male", name: "male"}
];

export const getColor = (value: number, range: IndicatorRange, colorFunction: (t: number) => string) => {
    let rangeNum = (range.max && (range.max != range.min)) ? //Avoid dividing by zero if only one value...
        range.max - (range.min || 0) :
        1;

    const colorValue = value / rangeNum;

    return colorFunction(colorValue);
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

export const flattenOptions = (filterOptions: NestedFilterOption[]): { [k: string]: NestedFilterOption } => {
    let result = {};
    filterOptions.forEach(r =>
        result = {
            ...result,
            ...flattenOption(r)
        });
    return result;
};

const flattenOption = (filterOption: NestedFilterOption): NestedFilterOption => {
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
