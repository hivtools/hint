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
        const value = action.payload[1];
        const filters =  state.selectedFilters;
        switch (action.payload[0]) {
            case (FilterType.Age):
                filters.age = value;
                break;
            case (FilterType.Region):
                filters.region = value;
                break;
            case (FilterType.Sex):
                filters.sex = value;
                break;
            case (FilterType.Survey):
                filters.surveys = value;
                break;
        }
    },
    ChoroplethFilterUpdated(state: FilteredDataState, action: PayloadWithType<[FilterType, FilterOption]>) {
        const value = action.payload[1];
        const filters =  state.selectedChoroplethFilters;
        switch (action.payload[0]) {
            case (FilterType.Age):
                filters.age = value;
                break;
            case (FilterType.Sex):
                filters.sex = value;
                break;
            case (FilterType.Survey):
                filters.survey = value;
                break;
        }
    }
};
