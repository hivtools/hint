import {RootState} from "./root";
import {currentHintVersion} from "./hintVersion";
import {Language} from "./store/translations/locales";

const appStateKey = `hintAppState_v${currentHintVersion}`;

export const serialiseState = (state: RootState): Partial<RootState> => {
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
    return {
        version: state.version,
        baseline,
        metadata,
        surveyAndProgram,
        modelRun: {
            ...state.modelRun,
            statusPollId: -1,
            result: null,
            errors: []
        },
        modelOptions: state.modelOptions,
        modelOutput: state.modelOutput,
        modelCalibrate: {
            ...state.modelCalibrate,
            result: null,
            fetchedIndicators: null,
            calibratePlotResult: null,
            comparisonPlotResult: null
        },
        stepper: state.stepper,
        hintrVersion: state.hintrVersion
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

    saveState = (state: RootState) => {
        const partialState = serialiseState(state);
        this.savePartialState(partialState);
    };

    savePartialState = (partialState: Partial<RootState>) => {
        window.localStorage.setItem(appStateKey, JSON.stringify(partialState));
    };

    getState = (): Partial<RootState> | null => {
        if (currentUser != window.localStorage.getItem("user")) {
            localStorage.clear();
            localStorage.setItem("user", currentUser);
        }

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
}

export const localStorageManager = new LocalStorageManager();
