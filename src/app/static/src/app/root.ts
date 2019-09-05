import {StoreOptions} from "vuex";
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {selectedData, initialSelectedDataState, SelectedDataState} from "./store/selectedData/selectedData";
import {
    initialSurveyAndProgramDataState,
    surveyAndProgram,
    SurveyAndProgramDataState
} from "./store/surveyAndProgram/surveyAndProgram";
import {PayloadWithType} from "./types";

export interface RootState {
    version: string;
    baseline: BaselineState,
    surveyAndProgram: SurveyAndProgramDataState,
    selectedData: SelectedDataState
}

export interface StepGetters {
    complete: boolean
}

/*export const rootGetters = {
    selectedDataFilterOptions: (state: RootState) => {
        const sapState = state.surveyAndProgram;
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
};*/



//const getters = rootGetters;
//const mutations = rootMutations;

export const storeOptions: StoreOptions<RootState> = {
    state: {
        version: '0.0.0',
        baseline: initialBaselineState,
        surveyAndProgram: initialSurveyAndProgramDataState,
        selectedData: initialSelectedDataState
    },
    modules: {
        baseline,
        surveyAndProgram,
        selectedData
    }
};