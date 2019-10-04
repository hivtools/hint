import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import { getters } from './getters';
import { RootState} from "../../root";
import { FilterOption } from "../../generated";
import {localStorageManager} from "../../localStorageManager";

export enum DataType { ANC, Program, Survey, Output }
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
    survey: FilterOption | null
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
    survey: null
};

export const initialFilteredDataState: FilteredDataState = {
   selectedDataType: null,
   selectedFilters: initialSelectedFilters,
   selectedChoroplethFilters: initialSelectedChoroplethFilters,
   regionIndicators: {}
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const filteredData: Module<FilteredDataState, RootState> = {
    namespaced,
    state: {...initialFilteredDataState, ...existingState && existingState.filteredData},
    actions,
    mutations,
    getters
};
