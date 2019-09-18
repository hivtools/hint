import {StoreOptions} from "vuex";
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {filteredData, initialFilteredDataState, FilteredDataState} from "./store/filteredData/filteredData";
import {
    initialSurveyAndProgramDataState,
    surveyAndProgram,
    SurveyAndProgramDataState
} from "./store/surveyAndProgram/surveyAndProgram";
import {initialModelRunState, modelRun, ModelRunState} from "./store/modelRun/modelRun";

export interface RootState {
    version: string;
    baseline: BaselineState,
    surveyAndProgram: SurveyAndProgramDataState,
    filteredData: FilteredDataState,
    modelRun: ModelRunState
}

export interface StepGetters {
    complete: boolean
}

export const storeOptions: StoreOptions<RootState> = {
    state: {
        version: '0.0.0',
        baseline: initialBaselineState,
        surveyAndProgram: initialSurveyAndProgramDataState,
        filteredData: initialFilteredDataState,
        modelRun: initialModelRunState
    },
    modules: {
        baseline,
        surveyAndProgram,
        filteredData,
        modelRun
    }
};