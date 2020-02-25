import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {ReadyState, RootState} from "../../root";
import {AncResponse, ProgrammeResponse, SurveyResponse, Error} from "../../generated";
import {getters} from "./getters";
import {localStorageManager} from "../../localStorageManager";

export enum DataType { ANC, Program, Survey}

export interface SurveyAndProgramState extends ReadyState {
    selectedDataType: DataType | null
    survey: SurveyResponse | null
    surveyError: Error | null
    program: ProgrammeResponse | null
    programError: Error | null
    anc: AncResponse | null
    ancError: Error | null
}

export const initialSurveyAndProgramState = (): SurveyAndProgramState => {
    return {
        selectedDataType: null,
        survey: null,
        surveyError: null,
        program: null,
        programError: null,
        anc: null,
        ancError: null,
        ready: false
    }
};

const namespaced: boolean = true;

const existingState = localStorageManager.getState();
export const surveyAndProgram: Module<SurveyAndProgramState, RootState> = {
    namespaced,
    state: {...initialSurveyAndProgramState(), ...existingState && existingState.surveyAndProgram},
    getters,
    actions,
    mutations
};



