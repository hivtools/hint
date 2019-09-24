import {PayloadWithType} from "../../types";
import {Mutation, MutationTree} from "vuex";
import {DataType, FilteredDataState, FilterType} from "./filteredData";
import {FilterOption} from "../../generated";

type FilteredDataMutation = Mutation<FilteredDataState>

export interface SelectedDataMutations {
    SelectedDataTypeUpdated: FilteredDataMutation
    FilterUpdated: FilteredDataMutation
    ChoroplethFilterUpdated: FilteredDataMutation
}

export const mutations: MutationTree<FilteredDataState> & SelectedDataMutations  = {
    SelectedDataTypeUpdated(state: FilteredDataState, action: PayloadWithType<DataType>) {
        state.selectedDataType = action.payload;
    },
    FilterUpdated(state: FilteredDataState, action: PayloadWithType<[FilterType, FilterOption[]]>) {
        state.selectedFilters.updateByType(action.payload[0], action.payload[1]);
    },
    ChoroplethFilterUpdated(state: FilteredDataState, action: PayloadWithType<[FilterType, FilterOption]>) {
        state.selectedChoroplethFilters.updateByType(action.payload[0], action.payload[1]);
    }
};
