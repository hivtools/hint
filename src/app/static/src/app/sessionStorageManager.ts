import {RootState} from "./root";
import {currentHintVersion} from "./hintVersion";
import {localStorageManager} from "./localStorageManager";

const appStateKey = `hintAppState_v${currentHintVersion}`;
const versionIdKey = "hintVersionId";
const userKey = "hintUser";

export const serialiseState = (state: RootState): Partial<RootState> => {
    const baseline = {
        selectedDataset: state.baseline.selectedDataset,
        selectedDatasetIsRefreshed: state.baseline.selectedDatasetHasChanged,
        selectedRelease: state.baseline.selectedRelease
    } as any;
    const surveyAndProgram = {
        warnings: state.surveyAndProgram.warnings
    } as any;
    const metadata =  {...state.metadata, reviewInputMetadataError: null};
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

/**
 * What a browser tab is working on: its working state and the id of the project version it has open. Each tab has
 * its own copy, so two tabs can work on different projects. A refresh keeps it. Closing the tab forgets it.
 * The id is sent to the server in the X-Version-Id header (see apiService.ts).
 */
export class SessionStorageManager {

    saveState = (state: RootState) => {
        const partialState = serialiseState(state);
        this.savePartialState(partialState);
    };

    savePartialState = (partialState: Partial<RootState>) => {
        window.sessionStorage.setItem(appStateKey, JSON.stringify(partialState));
    };

    getState = (): Partial<RootState> | null => {
        if (currentUser != window.sessionStorage.getItem(userKey)) {
            this.clear();
            window.sessionStorage.setItem(userKey, currentUser);
        }

        const item = window.sessionStorage.getItem(appStateKey);
        if (item) {
            const partialRootState = JSON.parse(item) as Partial<RootState>;
            /**
             * The language is shared by all tabs, so it is kept in local storage.
             * Default to English if there is none.
             */
            return {...partialRootState, language: localStorageManager.getLanguage()}
        } else {
            return null;
        }
    };

    getVersionId = (): string | null => {
        return window.sessionStorage.getItem(versionIdKey);
    };

    saveVersionId = (versionId: string | null) => {
        if (versionId) {
            window.sessionStorage.setItem(versionIdKey, versionId);
        } else {
            window.sessionStorage.removeItem(versionIdKey);
        }
    };

    // Only this tab's project. Other things in session storage, such as asGuest, are left alone
    clear = () => {
        window.sessionStorage.removeItem(appStateKey);
        window.sessionStorage.removeItem(versionIdKey);
    };
}

export const sessionStorageManager = new SessionStorageManager();
