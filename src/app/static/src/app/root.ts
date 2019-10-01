import {MutationPayload, Store, StoreOptions} from "vuex";
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {metadata, MetadataState, initialMetadataState} from "./store/metadata/metadata";
import {filteredData, FilteredDataState, initialFilteredDataState} from "./store/filteredData/filteredData";
import {
    initialSurveyAndProgramDataState,
    surveyAndProgram, SurveyAndProgramDataState,
} from "./store/surveyAndProgram/surveyAndProgram";
import {initialModelRunState, modelRun, ModelRunState} from "./store/modelRun/modelRun";
import {initialStepperState, stepper, StepperState} from "./store/stepper/stepper";
import {localStorageManager} from "./localStorageManager";
import {actions} from "./store/root/actions";
import {mutations} from "./store/root/mutations";

export interface RootState {
    version: string;
    baseline: BaselineState,
    metadata: MetadataState,
    surveyAndProgram: SurveyAndProgramDataState,
    filteredData: FilteredDataState,
    modelRun: ModelRunState,
    stepper: StepperState
}

export interface ReadyState {
    ready: boolean
}

const persistState = (store: Store<RootState>) => {
    store.subscribe((mutation: MutationPayload, state: RootState) => {
        localStorageManager.saveState(state);
    })
};

export const emptyState = {
    version: '0.0.0',
    baseline: initialBaselineState,
    metadata: initialMetadataState,
    surveyAndProgram: initialSurveyAndProgramDataState,
    filteredData: initialFilteredDataState,
    modelRun: initialModelRunState,
    stepper: initialStepperState
};

export const initialState = {
    ...emptyState,
    ...localStorageManager.getState()
};

export const storeOptions: StoreOptions<RootState> = {
    state: initialState,
    modules: {
        baseline,
        metadata,
        surveyAndProgram,
        filteredData,
        modelRun,
        stepper
    },
    actions: actions,
    mutations: mutations,
    plugins: [persistState]
};
