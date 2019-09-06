import {PayloadWithType} from "../../types";
import {Mutation, MutationTree} from "vuex";
import {DataType, FilteredDataState, FilterType} from "./filteredData";

type FilteredDataMutation = Mutation<FilteredDataState>

export interface SelectedDataMutations {
    SelectedDataTypeUpdated: FilteredDataMutation
    FilterAdded: FilteredDataMutation,
    FilterRemoved: FilteredDataMutation
}

export const mutations: MutationTree<FilteredDataState> & SelectedDataMutations  = {
    SelectedDataTypeUpdated(state: FilteredDataState, action: PayloadWithType<DataType>) {
        state.selectedDataType = action.payload;
    },
    FilterAdded(state: FilteredDataState, action: PayloadWithType<[FilterType, string]>) {
        const filterOptions = state.selectedFilters.byType(action.payload[0]);
        const filter = action.payload[1];
        if (filterOptions.indexOf(filter) < 0) {
            filterOptions.push(filter);
        }
    },
    FilterRemoved(state: FilteredDataState, action: PayloadWithType<[FilterType, string]>) {
        const filterOptions = state.selectedFilters.byType(action.payload[0]);
        const filter = action.payload[1];
        const index = filterOptions.indexOf(filter);
        if (index > -1) {
            filterOptions.splice(index, 1);
        }
    }
};