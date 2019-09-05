import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import {RootState} from "../../main";
import {ProgrammeResponse, SurveyResponse, AncResponse} from "../../generated";

export interface SurveyAndProgramDataState {
    survey: SurveyResponse | null
    surveyError: string,
    program: ProgrammeResponse | null
    programError: string
    anc: AncResponse | null
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
