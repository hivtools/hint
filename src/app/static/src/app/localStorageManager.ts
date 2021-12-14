import {RootState} from "./root";
import {currentHintVersion} from "./hintVersion";
import {DataExplorationState} from "./store/dataExploration/dataExploration";

const getAppStateKey = (dataExplorationMode: boolean) => {
    const appType = dataExplorationMode ? "hintAppState_explore" : "hintAppState";
    return `${appType}_v${currentHintVersion}`;
};

export const serialiseState = (state: DataExplorationState): Partial<RootState> => {
    if (state.dataExplorationMode) {
        return {
            version: state.version,
            baseline: {
                selectedDataset: state.baseline.selectedDataset,
                selectedRelease: state.baseline.selectedRelease
            } as any,
            metadata: {...state.metadata, plottingMetadataError:null},
            plottingSelections: state.plottingSelections,
            surveyAndProgram: {selectedDataType: state.surveyAndProgram.selectedDataType} as any,
            hintrVersion: state.hintrVersion,
            language: state.language
        }

    } else {
        const rootState = state as RootState;
        return {
            version: state.version,
            baseline: {
                selectedDataset: state.baseline.selectedDataset,
                selectedRelease: state.baseline.selectedRelease
            } as any,
            metadata: {...state.metadata, plottingMetadataError:null},
            plottingSelections: state.plottingSelections,
            surveyAndProgram: {selectedDataType: state.surveyAndProgram.selectedDataType} as any,
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
                result: null
            },
            stepper: rootState.stepper,
            projects: rootState.projects,
            hintrVersion: state.hintrVersion,
            language: state.language
        };
    }
};

declare const currentUser: string;

export class LocalStorageManager {

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
            return JSON.parse(item) as Partial<RootState>;
        } else {
            return null;
        }
    };

    deleteState = (dataExplorationMode: boolean): void => {
        window.localStorage.removeItem(getAppStateKey(dataExplorationMode));
    };
}

export const localStorageManager = new LocalStorageManager();
