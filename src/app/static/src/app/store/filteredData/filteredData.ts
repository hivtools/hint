import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import { getters } from './getters';
import { RootState} from "../../root";
import { FilterOption } from "../../generated";

export enum DataType { ANC, Survey, Program }
export enum FilterType { Sex, Age, Region, Survey }

export interface SelectedFilters {
    sex: FilterOption[],
    age: FilterOption[],
    region: FilterOption[],
    surveys: FilterOption[],
    getByType: (type: FilterType) => FilterOption[],
    updateByType: (type: FilterType, value: FilterOption[]) => void
}

export interface FilteredDataState {
    selectedDataType: DataType | null
    selectedFilters: SelectedFilters
}

export const initialSelectedFilters: SelectedFilters = {
    sex: [],
    age: [],
    region: [],
    surveys: [],
    getByType: function(type: FilterType): FilterOption[] {
        switch (type) {
            case (FilterType.Age):
                return this.age;
            case (FilterType.Region):
                return this.region;
            case (FilterType.Sex):
                return this.sex;
            case (FilterType.Survey):
                return this.surveys;
        }
    },
    updateByType: function(type: FilterType, value: FilterOption[]) {
        switch (type) {
            case (FilterType.Age):
                this.age = value;
                break;
            case (FilterType.Region):
                this.region = value;
                break;
            case (FilterType.Sex):
                this.sex = value;
                break;
            case (FilterType.Survey):
                this.surveys = value;
                break;
        }
    }
};

export const initialFilteredDataState: FilteredDataState = {
   selectedDataType: null,
   selectedFilters: initialSelectedFilters
};

const namespaced: boolean = true;

export const filteredData: Module<FilteredDataState, RootState> = {
    namespaced,
    state: initialFilteredDataState,
    actions,
    mutations,
    getters
};
