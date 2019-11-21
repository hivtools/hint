import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import { getters } from './getters';
import { RootState} from "../../root";
import {localStorageManager} from "../../localStorageManager";

export enum DataType { ANC, Program, Survey, Output }
export enum FilterType { Sex, Age, Region, Survey, Year }

export interface SelectedChoroplethFilters {
    sex: string,
    age: string,
    survey: string,
    year: string,
    regions: string[]
}

export interface FilteredDataState {
    selectedDataType: DataType | null
    selectedChoroplethFilters: SelectedChoroplethFilters
    regionIndicators: {[k: string]: any};
}

export const initialSelectedChoroplethFilters: SelectedChoroplethFilters = {
    sex: "",
    age: "",
    survey: "",
    regions: [],
    year: ""
};

export const initialFilteredDataState: FilteredDataState = {
   selectedDataType: null,
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
