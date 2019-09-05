import { Module } from 'vuex';
import { mutations } from './mutations';
import { RootState} from "../../root";
import {SurveyAndProgramDataState} from "../surveyAndProgram/surveyAndProgram";

export enum DataType { ANC, Survey, Program }

export interface SelectedDataState {
    selectedDataType: DataType | null
}

export const initialSelectedDataState: SelectedDataState = {
   selectedDataType: null
};

const namespaced: boolean = true;

export const selectedData: Module<SelectedDataState, RootState> = {
    namespaced,
    state: initialSelectedDataState,
    mutations
};
