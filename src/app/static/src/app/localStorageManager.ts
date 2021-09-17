import {RootState} from "./root";
import {currentHintVersion} from "./hintVersion";

const appStateKey = `hintAppState_v${currentHintVersion}`;

export const serialiseState = (rootState: RootState): Partial<RootState> => {
    return {
        version: rootState.version,
        baseline: {selectedDataset: rootState.baseline.selectedDataset} as any,
        modelRun: {
            ...rootState.modelRun,
            statusPollId: -1,
            result: null,
            errors: []
        },
        modelOptions: rootState.modelOptions,
        modelOutput: rootState.modelOutput,
        modelCalibrate: rootState.modelCalibrate,
        stepper: rootState.stepper,
        metadata: {...rootState.metadata, plottingMetadataError:null},
        plottingSelections: rootState.plottingSelections,
        surveyAndProgram: {selectedDataType: rootState.surveyAndProgram.selectedDataType} as any,
        projects: rootState.projects,
        hintrVersion: rootState.hintrVersion
    };
};

declare const currentUser: string;

const GUEST = "continueAsGuest";
const GUEST_KEY = "asGuest";

export class LocalStorageManager {

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
            return JSON.parse(item) as Partial<RootState>;
        } else {
            return null;
        }
    };
}

export const localStorageManager = new LocalStorageManager();
