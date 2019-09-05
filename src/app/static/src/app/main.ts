import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {
    initialSurveyAndProgramDataState,
    surveyAndProgram,
    SurveyAndProgramDataState
} from "./store/surveyAndProgram/surveyAndProgram";
import {AncResponse, ProgrammeResponse, SurveyResponse} from "./generated";

export interface RootState {
    version: string;
    baseline: BaselineState,
    surveyAndProgram: SurveyAndProgramDataState,
    selectedDataType: DataType | null
}

export interface StepGetters {
   complete: boolean
}

Vue.use(Vuex);

export enum DataType { ANC, Survey, Program }

const storeOptions: StoreOptions<RootState> = {
    state: {
        version: '0.0.0',
        baseline: initialBaselineState,
        surveyAndProgram: initialSurveyAndProgramDataState,
        selectedDataType: null
    },
    modules: {
        baseline,
        surveyAndProgram
    },
    getters: {
        selectedDataFilterOptions: (state) => {
            const sapState = state.surveyAndProgram
            switch(state.selectedDataType){
                case (DataType.ANC):
                    return sapState.anc ? sapState.anc.filters : null;
                case (DataType.Program):
                    return sapState.program ? sapState.program.filters : null;
                case (DataType.Survey):
                    return sapState.survey ? sapState.survey.filters : null;
                default:
                    return null;
            }
        }
    }
};

export const store = new Vuex.Store<RootState>(storeOptions);
