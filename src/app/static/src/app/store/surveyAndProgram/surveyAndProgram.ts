import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import {RootState, StepState} from "../../main";
import {ShapeResponse} from "../../generated";

export interface SurveyAndProgramDataState extends StepState {
    survey: ShapeResponse | null
    surveyError: string,
    program: ShapeResponse | null
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
