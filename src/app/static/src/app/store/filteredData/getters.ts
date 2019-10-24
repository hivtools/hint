import {RootState} from "../../root";
import {DataType, FilteredDataState,} from "./filteredData";

import {FilterOption, NestedFilterOption} from "../../generated";
import {Dict} from "../../types";
import {sexFilterOptions} from "./utils";

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState): Dict<FilterOption[] | undefined> | null => {
        const sapState = rootState.surveyAndProgram;
        const shape = rootState.baseline && rootState.baseline.shape;
        let regions: NestedFilterOption[] = [];
        if (shape && shape.filters.regions && shape.filters.regions.children) {
            regions = shape.filters.regions.children as NestedFilterOption[]
        }
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
    }
};

