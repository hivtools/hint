import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import {RootState, StepState} from "../../main";
import {ProgramResponse, SurveyResponse} from "../../types";

export interface SurveyAndProgramDataState extends StepState {
    survey: SurveyResponse | null
    surveyError: string,
    program: ProgramResponse | null
    programError: string
}

export const initialSurveyAndProgramDataState: SurveyAndProgramDataState = {
    survey: null,
    surveyError: "",
    program: null,
    programError: "",
    complete: false
};

const namespaced: boolean = true;

export const surveyAndProgram: Module<SurveyAndProgramDataState, RootState> = {
    namespaced,
    state: initialSurveyAndProgramDataState,
    getters: {},
    actions,
    mutations
};
