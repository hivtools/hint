import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {ReadyState, RootState} from "../../root";
import {AncResponse, ProgrammeResponse, SurveyResponse} from "../../generated";

export interface SurveyAndProgramDataState extends ReadyState {
    survey: SurveyResponse | null
    surveyError: Error | null
    program: ProgrammeResponse | null
    programError: Error | null
    anc: AncResponse | null
    ancError: Error | null
}

export const initialSurveyAndProgramDataState = (): SurveyAndProgramDataState => {
    return {
        survey: null,
        surveyError: null,
        program: null,
        programError: null,
        anc: null,
        ancError: null,
        ready: false
    }
};

export const surveyAndProgramGetters = {
    complete: (state: SurveyAndProgramDataState) => {
        return !!state.survey && !state.programError && !state.ancError
    }
};

const namespaced: boolean = true;

export const surveyAndProgram: Module<SurveyAndProgramDataState, RootState> = {
    namespaced,
    state: initialSurveyAndProgramDataState(),
    getters: surveyAndProgramGetters,
    actions,
    mutations
};


