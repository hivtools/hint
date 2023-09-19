import {RootState} from "./root";
import {currentHintVersion} from "./hintVersion";
import {DataExplorationState} from "./store/dataExploration/dataExploration";
import {Language} from "./store/translations/locales";

const getAppStateKey = (dataExplorationMode: boolean) => {
    const appType = dataExplorationMode ? "hintAppState_explore" : "hintAppState";
    return `${appType}_v${currentHintVersion}`;
};

export const serialiseState = (state: DataExplorationState): Partial<RootState> => {
    const baseline = {
        selectedDataset: state.baseline.selectedDataset,
        selectedDatasetIsRefreshed: state.baseline.selectedDatasetHasChanged,
        selectedRelease: state.baseline.selectedRelease
    } as any;
    const surveyAndProgram = {
        selectedDataType: state.surveyAndProgram.selectedDataType,
        warnings: state.surveyAndProgram.warnings
    } as any;
    const metadata =  {...state.metadata, plottingMetadataError: null};
    const plottingSelections = state.plottingSelections;
    if (state.dataExplorationMode) {
        return {
            version: state.version,
            baseline,
            metadata,
            plottingSelections,
            surveyAndProgram,
            stepper: state.stepper,
            hintrVersion: state.hintrVersion
        }

    } else {
        const rootState = state as RootState;
        return {
            version: state.version,
            baseline,
            metadata,
            plottingSelections,
            surveyAndProgram,
            modelRun: {
                ...rootState.modelRun,
                statusPollId: -1,
                result: null,
                errors: []
            },
            modelOptions: rootState.modelOptions,
            modelOutput: rootState.modelOutput,
            modelCalibrate: {
                ...rootState.modelCalibrate,
                result: null,
                calibratePlotResult: null,
                comparisonPlotResult: null
            },
            stepper: rootState.stepper,
            hintrVersion: state.hintrVersion
        };
    }
};

declare const currentUser: string;

export class LocalStorageManager {

    saveLanguage = (lang: Language) => {
        localStorage.setItem("language", lang);
    }

    getLanguage = (): Language => {
        const storedLang = localStorage.getItem("language")
        return storedLang ? storedLang as Language : Language.en;
    }

    saveState = (state: DataExplorationState) => {
        const partialState = serialiseState(state);
        this.savePartialState(partialState, state.dataExplorationMode);
    };

    savePartialState = (partialState: Partial<RootState>, dataExplorationMode: boolean) => {
        const appStateKey = getAppStateKey(dataExplorationMode);
            window.localStorage.setItem(appStateKey, JSON.stringify(partialState));
    };

    getState = (dataExplorationMode: boolean): Partial<RootState> | null => {
        if (currentUser != window.localStorage.getItem("user")) {
            localStorage.clear();
            localStorage.setItem("user", currentUser);
        }

        const appStateKey = getAppStateKey(dataExplorationMode);
        const item = window.localStorage.getItem(appStateKey);
        if (item) {
            const partialRootState = JSON.parse(item) as Partial<RootState>;
            /**
             * For smooth compatibility, code uses local storage persisted language state,
             * and default to English if needed.
             */
            return {...partialRootState, language: this.getLanguage()}
        } else {
            return null;
        }
    };

    deleteState = (dataExplorationMode: boolean): void => {
        window.localStorage.removeItem(getAppStateKey(dataExplorationMode));
    };
}

export const localStorageManager = new LocalStorageManager();
