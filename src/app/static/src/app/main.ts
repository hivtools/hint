import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {
    initialSurveyAndProgramDataState,
    surveyAndProgram,
    SurveyAndProgramDataState
} from "./store/surveyAndProgram/surveyAndProgram";

export interface RootState {
    version: string;
    baseline: BaselineState,
    surveyAndProgram: SurveyAndProgramDataState
}

export interface StepGetters {
   complete: boolean
}

Vue.use(Vuex);

const storeOptions: StoreOptions<RootState> = {
    state: {
        version: '0.0.0',
        baseline: initialBaselineState,
        surveyAndProgram: initialSurveyAndProgramDataState
    },
    modules: {
        baseline,
        surveyAndProgram
    }
};

export const store = new Vuex.Store<RootState>(storeOptions);
