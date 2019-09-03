import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import {RootState, StepState} from "../../main";
import {ProgramResponse, SurveyResponse, ANCResponse} from "../../types";

export interface SurveyAndProgramDataState extends StepState {
    survey: SurveyResponse | null
    surveyError: string,
    program: ProgramResponse | null
    programError: string
    anc: ANCResponse | null
    ancError: string
}

export const initialSurveyAndProgramDataState: SurveyAndProgramDataState = {
    survey: null,
    surveyError: "",
    program: null,
    programError: "",
    anc: null,
    ancError: "",
    complete: function() {
        return !!this.survey && !!this.program && !!this.anc
    }
};

const namespaced: boolean = true;

export const surveyAndProgram: Module<SurveyAndProgramDataState, RootState> = {
    namespaced,
    state: initialSurveyAndProgramDataState,
    getters: {},
    actions,
    mutations
};
