import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import { getters } from './getters';
import { RootState} from "../../root";
import {FilterOption, NestedFilterOption} from "../../generated";

export enum DataType { ANC, Program, Survey }
export enum FilterType { Sex, Age, Region, Survey }

export interface SelectedFilters {
    sex: FilterOption[],
    age: FilterOption[],
    region: FilterOption[],
    surveys: FilterOption[]
}

export interface SelectedChoroplethFilters {
    sex: FilterOption | null,
    age: FilterOption | null,
    survey: FilterOption | null,
    region: NestedFilterOption | null
}

export interface FilteredDataState {
    selectedDataType: DataType | null
    selectedFilters: SelectedFilters
    selectedChoroplethFilters: SelectedChoroplethFilters
    regionIndicators: {[k: string]: any};
}

export const initialSelectedFilters: SelectedFilters = {
    sex: [],
    age: [],
    region: [],
    surveys: []
};

export const initialSelectedChoroplethFilters: SelectedChoroplethFilters = {
    sex: null,
    age: null,
    survey: null,
    region: null
};

export const initialFilteredDataState: FilteredDataState = {
   selectedDataType: null,
   selectedFilters: initialSelectedFilters,
   selectedChoroplethFilters: initialSelectedChoroplethFilters,
   regionIndicators: {}
};

const namespaced: boolean = true;

export const filteredData: Module<FilteredDataState, RootState> = {
    namespaced,
    state: initialFilteredDataState,
    actions,
    mutations,
    getters
};
