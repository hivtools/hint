import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {
    initialSurveyAndProgramDataState,
    surveyAndProgram,
    SurveyAndProgramDataState
} from "./store/surveyAndProgram/surveyAndProgram";
import {password, initialPasswordState, PasswordState} from "./store/password/password";

export interface RootState {
    version: string;
    password: PasswordState,
    baseline: BaselineState,
    surveyAndProgram: SurveyAndProgramDataState
}

export interface StepState {
    complete: boolean
}

Vue.use(Vuex);

const storeOptions: StoreOptions<RootState> = {
    state: {
        version: '0.0.0',
        password: initialPasswordState,
        baseline: initialBaselineState,
        surveyAndProgram: initialSurveyAndProgramDataState
    },
    modules: {
        password,
        baseline,
        surveyAndProgram
    }
};

export const store = new Vuex.Store<RootState>(storeOptions);
