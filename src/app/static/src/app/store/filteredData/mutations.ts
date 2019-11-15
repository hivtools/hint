import {PayloadWithType} from "../../types";
import {Mutation, MutationTree} from "vuex";
import {DataType, FilteredDataState, FilterType} from "./filteredData";
import {emptyState} from "../../root";

type FilteredDataMutation = Mutation<FilteredDataState>

export interface SelectedDataMutations {
    SelectedDataTypeUpdated: FilteredDataMutation
    ChoroplethFilterUpdated: FilteredDataMutation
    Reset: FilteredDataMutation
}

export const mutations: MutationTree<FilteredDataState> & SelectedDataMutations  = {
    SelectedDataTypeUpdated(state: FilteredDataState, action: PayloadWithType<DataType>) {
        state.selectedDataType = action.payload;
    },
    ChoroplethFilterUpdated(state: FilteredDataState, action: PayloadWithType<[FilterType, string | string[]]>) {
        const value = action.payload[1];
        const filters =  state.selectedChoroplethFilters;
        switch (action.payload[0]) {
            case (FilterType.Age):
                filters.age = value as string;
                break;
            case (FilterType.Sex):
                filters.sex = value as string;
                break;
            case (FilterType.Survey):
                filters.survey = value as string;
                break;
            case (FilterType.Quarter):
                filters.quarter = value as string;
                break;
            case (FilterType.Region):
                filters.regions = value as string[];
                break;
        }
    },
    Reset(state: FilteredDataState) {
        Object.assign(state, emptyState.filteredData);
    }
};
