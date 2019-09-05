import {StoreOptions} from "vuex";
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {filteredData, initialFilteredDataState, FilteredDataState} from "./store/filteredData/filteredData";
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
    filteredData: FilteredDataState
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

export const storeOptions: StoreOptions<RootState> = {
    state: {
        version: '0.0.0',
        baseline: initialBaselineState,
        surveyAndProgram: initialSurveyAndProgramDataState,
        filteredData: initialFilteredDataState
    },
    modules: {
        baseline,
        surveyAndProgram,
        selectedData: filteredData
    }
};