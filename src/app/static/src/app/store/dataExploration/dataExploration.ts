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
import {Module, StoreOptions} from "vuex";
import {TranslatableState} from "../../root";
import {Error} from "../../generated";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {getters} from "./getters";

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
    errorReportError: Error | null
    errorReportSuccess: boolean,
    dataExplorationMode: boolean
}

export const initialDataExplorationState = (): DataExplorationState => {
    return {
        language: Language.en,
        version: currentHintVersion,
        updatingLanguage: false,
        errorReportError: null,
        errorReportSuccess: false,
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
const existingState = localStorageManager.getState();

export const storeOptions: StoreOptions<DataExplorationState> = {
    state: {...initialDataExplorationState(), ...existingState},
    modules: {
        adr,
        genericChart,
        baseline,
        metadata,
        surveyAndProgram,
        plottingSelections,
        errors,
        hintrVersion
    },
    actions,
    mutations,
    getters
};
