import {MutationPayload, Store, StoreOptions} from "vuex";
import {Error} from "./generated";
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";
import {projects, initialProjectsState, ProjectsState} from "./store/projects/projects";
import {initialMetadataState, metadata, MetadataState} from "./store/metadata/metadata";
import {
    initialSurveyAndProgramState,
    surveyAndProgram,
    SurveyAndProgramState,
} from "./store/surveyAndProgram/surveyAndProgram";
import {initialModelRunState, modelRun, ModelRunState} from "./store/modelRun/modelRun";
import {initialStepperState, stepper, StepperState} from "./store/stepper/stepper";
import {initialLoadState, load, LoadState} from "./store/load/load";
import {initialModelOutputState, modelOutput, ModelOutputState} from "./store/modelOutput/modelOutput";
import {localStorageManager} from "./localStorageManager";
import {actions} from "./store/root/actions";
import {mutations, RootMutation} from "./store/root/mutations";
import {getters} from "./store/root/getters";
import {initialModelOptionsState, modelOptions, ModelOptionsState} from "./store/modelOptions/modelOptions";
import {ModelOptionsMutation, ModelOptionsUpdates} from "./store/modelOptions/mutations";
import {SurveyAndProgramMutation, SurveyAndProgramUpdates} from "./store/surveyAndProgram/mutations";
import {BaselineMutation, BaselineUpdates} from "./store/baseline/mutations";
import {stripNamespace} from "./utils";
import {
    initialPlottingSelectionsState,
    plottingSelections,
    PlottingSelectionsState
} from "./store/plottingSelections/plottingSelections";
import {errors, ErrorsState, initialErrorsState} from "./store/errors/errors";
import {Language} from "./store/translations/locales";
import {ADRSchemas} from "./types";
import {modelCalibrate, initialModelCalibrateState, ModelCalibrateState} from "./store/modelCalibrate/modelCalibrate";
import { initialHintrVersionState, hintrVersion, HintrVersionState } from "./store/hintrVersion/hintrVersion";

export interface TranslatableState {
    language: Language
}

export interface RootState extends TranslatableState {
    version: string,
    hintrVersion: HintrVersionState,
    adrDatasets: any[],
    adrKey: string | null,
    adrKeyError: Error | null,
    adrSchemas: ADRSchemas | null,
    baseline: BaselineState,
    metadata: MetadataState,
    surveyAndProgram: SurveyAndProgramState,
    modelOptions: ModelOptionsState
    modelRun: ModelRunState,
    modelCalibrate: ModelCalibrateState,
    modelOutput: ModelOutputState,
    plottingSelections: PlottingSelectionsState,
    stepper: StepperState,
    load: LoadState,
    errors: ErrorsState,
    projects: ProjectsState
    currentUser: string
}

export interface ReadyState {
    ready: boolean
}

const persistState = (store: Store<RootState>) => {
    store.subscribe((mutation: MutationPayload, state: RootState) => {
        console.log(mutation.type);
        localStorageManager.saveState(state);

        const {dispatch} = store;
        const type = stripNamespace(mutation.type);
        if (type[0] !== "projects" && type[0] !== "errors") {
            dispatch("projects/uploadVersionState", {root: true});
        }
    })
};

const resetState = (store: Store<RootState>) => {
    store.subscribe((mutation: MutationPayload, state: RootState) => {

        if (state.baseline.ready
            && state.surveyAndProgram.ready
            && state.modelRun.ready) {

            const type = stripNamespace(mutation.type);

            if (type[0] == "baseline" && BaselineUpdates.includes(type[1] as BaselineMutation)) {
                store.commit(RootMutation.ResetSelectedDataType);
                store.commit(RootMutation.ResetOptions);
                store.commit(RootMutation.ResetOutputs);
            }

            if (type[0] == "surveyAndProgram" && SurveyAndProgramUpdates.includes(type[1] as SurveyAndProgramMutation)) {

                store.commit(RootMutation.ResetSelectedDataType);
                store.commit(RootMutation.ResetOptions);
                store.commit(RootMutation.ResetOutputs);
            }

            if (type[0] == "modelOptions" && ModelOptionsUpdates.includes(type[1] as ModelOptionsMutation)) {
                store.commit(RootMutation.ResetOutputs);
            }
        }
    })
};

declare const currentUser: string;

export const emptyState = (): RootState => {
    return {
        adrKey: null,
        adrKeyError: null,
        adrDatasets: [],
        adrSchemas: null,
        language: Language.en,
        version: '0.0.0',
        hintrVersion: initialHintrVersionState(),
        baseline: initialBaselineState(),
        metadata: initialMetadataState(),
        surveyAndProgram: initialSurveyAndProgramState(),
        modelCalibrate: initialModelCalibrateState(),
        modelOptions: initialModelOptionsState(),
        modelOutput: initialModelOutputState(),
        modelRun: initialModelRunState(),
        stepper: initialStepperState(),
        load: initialLoadState(),
        plottingSelections: initialPlottingSelectionsState(),
        errors: initialErrorsState(),
        projects: initialProjectsState(),
        currentUser: currentUser
    }
};

export const storeOptions: StoreOptions<RootState> = {
    state: emptyState(),
    modules: {
        baseline,
        metadata,
        surveyAndProgram,
        modelCalibrate,
        modelOptions,
        modelRun,
        modelOutput,
        plottingSelections,
        stepper,
        load,
        errors,
        projects,
        hintrVersion
    },
    actions: actions,
    mutations: mutations,
    getters: getters,
    plugins: [persistState, resetState]
};

