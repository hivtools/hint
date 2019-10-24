import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import { getters } from './getters';
import { RootState} from "../../root";
import {localStorageManager} from "../../localStorageManager";

export enum DataType { ANC, Program, Survey, Output }
export enum FilterType { Sex, Age, Region, Survey, Quarter }

export interface SelectedChoroplethFilters {
    sex: string | null,
    age: string | null,
    survey: string | null,
    quarter: string | null,
    regions: string[] | null
}

export interface FilteredDataState {
    selectedDataType: DataType | null
    selectedChoroplethFilters: SelectedChoroplethFilters
    regionIndicators: {[k: string]: any};
}

export const initialSelectedChoroplethFilters: SelectedChoroplethFilters = {
    sex: null,
    age: null,
    survey: null,
    regions: null,
    quarter: null
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
