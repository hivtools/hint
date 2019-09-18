import {StoreOptions} from "vuex";
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {filteredData, initialFilteredDataState, FilteredDataState} from "./store/filteredData/filteredData";
import {
    initialSurveyAndProgramDataState,
    surveyAndProgram,
    SurveyAndProgramDataState
} from "./store/surveyAndProgram/surveyAndProgram";

export interface RootState {
    version: string;
    baseline: BaselineState,
    surveyAndProgram: SurveyAndProgramDataState,
    filteredData: FilteredDataState
}

export interface InputState {
    ready: boolean
}

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
        filteredData
    }
};