import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {ReadyState, RootState, WarningsState} from "../../root";
import {AncResponse, ProgrammeResponse, SurveyResponse, Error} from "../../generated";
import {getters} from "./getters";
import {DataExplorationState} from "../dataExploration/dataExploration";

export enum DataType { ANC, Program, Survey}

export interface SurveyAndProgramState extends ReadyState, WarningsState {
    selectedDataType: DataType | null
    survey: SurveyResponse | null
    surveyError: Error | null
    surveyErroredFile: string | null
    program: ProgrammeResponse | null
    programError: Error | null
    programErroredFile: string | null
    anc: AncResponse | null
    ancError: Error | null
    ancErroredFile: string | null
}

export const initialSurveyAndProgramState = (): SurveyAndProgramState => {
    return {
        selectedDataType: null,
        survey: null,
        surveyError: null,
        surveyErroredFile: null,
        program: null,
        programError: null,
        programErroredFile: null,
        anc: null,
        ancError: null,
        ancErroredFile: null,
        ready: false,
        warnings: []
    }
};

const namespaced = true;

export const surveyAndProgram = (existingState: Partial<DataExplorationState> | null): Module<SurveyAndProgramState, DataExplorationState> => {
    return {
        namespaced,
        state: {...initialSurveyAndProgramState(), ...existingState && existingState.surveyAndProgram},
        getters,
        actions,
        mutations
    };
};



