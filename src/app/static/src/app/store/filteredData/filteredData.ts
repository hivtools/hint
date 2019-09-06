import { Module } from 'vuex';
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
    byType: (type: FilterType) => string[]
}

export interface FilteredDataState {
    selectedDataType: DataType | null
    selectedFilters: SelectedFilters
}

export const initialFilteredDataState: FilteredDataState = {
   selectedDataType: null,
   selectedFilters: {
       sex: [],
       age: [],
       region: [],
       survey: [],
       byType: function(type: FilterType): string[] {
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
       }
   }
};

const namespaced: boolean = true;

export const filteredData: Module<FilteredDataState, RootState> = {
    namespaced,
    state: initialFilteredDataState,
    mutations,
    getters
};
