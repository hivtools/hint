import {StoreOptions} from "vuex";
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {filteredData, initialFilteredDataState, FilteredDataState} from "./store/filteredData/filteredData";
import {
    initialSurveyAndProgramDataState,
    surveyAndProgram,
    SurveyAndProgramDataState
} from "./store/surveyAndProgram/surveyAndProgram";
import {initialModelRunState, modelRun, ModelRunState} from "./store/modelRun/modelRun";
import {initialStepperState, stepper, StepperState} from "./store/stepper/stepper";

export interface RootState {
    version: string;
    baseline: BaselineState,
    surveyAndProgram: SurveyAndProgramDataState,
    filteredData: FilteredDataState,
    modelRun: ModelRunState,
    stepper: StepperState
}

export interface ReadyState {
    ready: boolean
}

export const storeOptions: StoreOptions<RootState> = {
    state: {
        version: '0.0.0',
        baseline: initialBaselineState,
        surveyAndProgram: initialSurveyAndProgramDataState,
        filteredData: initialFilteredDataState,
        modelRun: initialModelRunState,
        stepper: initialStepperState
    },
    modules: {
        baseline,
        surveyAndProgram,
        filteredData,
        modelRun,
        stepper
    }
};