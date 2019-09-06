import { Module } from 'vuex';
import { mutations } from './mutations';
import { getters } from './getters';
import { RootState} from "../../root";

export enum DataType { ANC, Survey, Program }

export interface FilteredDataState {
    selectedDataType: DataType | null
}

export const initialFilteredDataState: FilteredDataState = {
   selectedDataType: null
};

const namespaced: boolean = true;

export const filteredData: Module<FilteredDataState, RootState> = {
    namespaced,
    state: initialFilteredDataState,
    mutations,
    getters
};
