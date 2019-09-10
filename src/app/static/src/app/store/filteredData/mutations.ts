import {PayloadWithType} from "../../types";
import {Mutation, MutationTree} from "vuex";
import {DataType, FilteredDataState, FilterType} from "./filteredData";

type FilteredDataMutation = Mutation<FilteredDataState>

export interface SelectedDataMutations {
    SelectedDataTypeUpdated: FilteredDataMutation
    FilterUpdated: FilteredDataMutation
}

export const mutations: MutationTree<FilteredDataState> & SelectedDataMutations  = {
    SelectedDataTypeUpdated(state: FilteredDataState, action: PayloadWithType<DataType>) {
        state.selectedDataType = action.payload;
    },
    FilterUpdated(state: FilteredDataState, action: PayloadWithType<[FilterType, string[]]>) {
        state.selectedFilters.updateByType(action.payload[0], action.payload[1]);
    }
};