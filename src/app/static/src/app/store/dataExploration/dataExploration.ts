import {Language} from "../translations/locales";
import {currentHintVersion} from "../../hintVersion";
import {hintrVersion, HintrVersionState, initialHintrVersionState} from "../hintrVersion/hintrVersion";
import {adr, ADRState, initialADRState} from "../adr/adr";
import {genericChart, GenericChartState, initialGenericChartState} from "../genericChart/genericChart";
import {ADRUploadState, initialADRUploadState} from "../adrUpload/adrUpload";
import {baseline, BaselineState, initialBaselineState} from "../baseline/baseline";
import {initialMetadataState, metadata, MetadataState} from "../metadata/metadata";
import {
    initialSurveyAndProgramState,
    surveyAndProgram,
    SurveyAndProgramState
} from "../surveyAndProgram/surveyAndProgram";
import {
    initialPlottingSelectionsState,
    plottingSelections,
    PlottingSelectionsState
} from "../plottingSelections/plottingSelections";
import {errors, ErrorsState, initialErrorsState} from "../errors/errors";
import {localStorageManager} from "../../localStorageManager";
import {StoreOptions} from "vuex";
import {Error} from "../../generated";
import {TranslatableState} from "../../types";
import {mutations} from "./mutations";
import {getters} from "./getters";
import {actions} from "./actions";

declare const currentUser: string;

export interface DataExplorationState extends TranslatableState {
    version: string,
    adr: ADRState,
    genericChart: GenericChartState,
    adrUpload: ADRUploadState,
    hintrVersion: HintrVersionState,
    baseline: BaselineState,
    metadata: MetadataState,
    surveyAndProgram: SurveyAndProgramState,
    plottingSelections: PlottingSelectionsState,
    errors: ErrorsState,
    currentUser: string,
    updatingLanguage: boolean,
    dataExplorationMode: boolean
}

export const initialDataExplorationState = (): DataExplorationState => {
    return {
        language: Language.en,
        version: currentHintVersion,
        updatingLanguage: false,
        hintrVersion: initialHintrVersionState(),
        adr: initialADRState(),
        genericChart: initialGenericChartState(),
        adrUpload: initialADRUploadState(),
        baseline: initialBaselineState(),
        metadata: initialMetadataState(),
        surveyAndProgram: initialSurveyAndProgramState(),
        plottingSelections: initialPlottingSelectionsState(),
        errors: initialErrorsState(),
        currentUser: currentUser,
        dataExplorationMode: true
    }
};
const existingState = localStorageManager.getState(true);

export const storeOptions: StoreOptions<DataExplorationState> = {
    state: {...initialDataExplorationState(), ...existingState},
    modules: {
        adr,
        genericChart,
        baseline: baseline(existingState),
        metadata: metadata(existingState),
        surveyAndProgram: surveyAndProgram(existingState),
        plottingSelections: plottingSelections(existingState),
        errors,
        hintrVersion: hintrVersion(existingState)
    },
    mutations,
    getters,
    actions
};
