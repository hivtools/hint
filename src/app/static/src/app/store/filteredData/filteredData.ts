import { Module } from 'vuex';
import { mutations } from './mutations';
import { RootState} from "../../root";

export enum DataType { ANC, Survey, Program }

export interface FilteredDataState {
    selectedDataType: DataType | null
}

export const initialFilteredDataState: FilteredDataState = {
   selectedDataType: null
};

const namespaced: boolean = true;

export const filteredDataGetters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const sapState = rootState.surveyAndProgram;
        switch(state.selectedDataType){
            case (DataType.ANC):
                return sapState.anc ? sapState.anc.filters : null;
            case (DataType.Program):
                return sapState.program ? sapState.program.filters : null;
            case (DataType.Survey):
                return sapState.survey ? sapState.survey.filters : null;
            default:
                return null;
        }
    }
};

export const filteredData: Module<FilteredDataState, RootState> = {
    namespaced,
    state: initialFilteredDataState,
    mutations,
    getters: filteredDataGetters
};
