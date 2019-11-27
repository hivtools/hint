import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {getters} from './getters';
import {RootState} from "../../root";
import {localStorageManager} from "../../localStorageManager";

export enum DataType { ANC, Program, Survey, Output }
export enum FilterType { Sex, Age, Region, Survey, Year, Quarter }

export interface SelectedChoroplethFilters {
    sex: string,
    age: string,
    survey: string,
    year: string,
    regions: string[],
    quarter: string
}

export interface FilteredDataState {
    selectedDataType: DataType | null
    selectedChoroplethFilters: SelectedChoroplethFilters
}

export const initialSelectedChoroplethFilters = (): SelectedChoroplethFilters => {
    return {
        sex: "",
        age: "",
        survey: "",
        regions: [],
        year: "",
        quarter: ""
    }
};

export const initialFilteredDataState = (): FilteredDataState => {
    return {
        selectedDataType: null,
        selectedChoroplethFilters: initialSelectedChoroplethFilters()
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const filteredData: Module<FilteredDataState, RootState> = {
    namespaced,
    state: {...initialFilteredDataState(), ...existingState && existingState.filteredData},
    actions,
    mutations,
    getters
};
