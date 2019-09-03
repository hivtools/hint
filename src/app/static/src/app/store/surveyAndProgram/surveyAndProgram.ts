import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import {RootState} from "../../main";
import {ProgramResponse, SurveyResponse, ANCResponse} from "../../types";

export interface SurveyAndProgramDataState {
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
    ancError: ""
};

export const surveyAndProgramGetters = {
    complete: (state: SurveyAndProgramDataState) => {
        return !!state.survey && !!state.program && !!state.anc
    }
};

const namespaced: boolean = true;

export const surveyAndProgram: Module<SurveyAndProgramDataState, RootState> = {
    namespaced,
    state: initialSurveyAndProgramDataState,
    getters: surveyAndProgramGetters,
    actions,
    mutations
};
