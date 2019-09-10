import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import { getters } from './getters';
import { RootState} from "../../root";

export enum DataType { ANC, Survey, Program }
export enum FilterType { Sex, Age, Region, Survey }

export interface SelectedFilters {
    sex: string[],
    age: string[],
    region: string[],
    survey: string[],
    getByType: (type: FilterType) => string[],
    updateByType: (type: FilterType, value: string[]) => void
}

export interface FilteredDataState {
    selectedDataType: DataType | null
    selectedFilters: SelectedFilters
}

export const initialSelectedFilters: SelectedFilters = {
    sex: [],
    age: [],
    region: [],
    survey: [],
    getByType: function(type: FilterType): string[] {
        switch (type) {
            case (FilterType.Age):
                return this.age;
            case (FilterType.Region):
                return this.region;
            case (FilterType.Sex):
                return this.sex;
            case (FilterType.Survey):
                return this.survey;
        }
    },
    updateByType: function(type: FilterType, value: string[]) {
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
                this.survey = value;
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
