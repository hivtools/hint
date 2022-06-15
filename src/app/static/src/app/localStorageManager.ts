import {RootState} from "./root";
import {currentHintVersion} from "./hintVersion";
import {DataExplorationState} from "./store/dataExploration/dataExploration";

const getAppStateKey = (dataExplorationMode: boolean) => {
    const appType = dataExplorationMode ? "hintAppState_explore" : "hintAppState";
    return `${appType}_v${currentHintVersion}`;
};

export const serialiseState = (state: DataExplorationState): Partial<RootState> => {
    const baseline = {
        selectedDataset: state.baseline.selectedDataset,
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
            hintrVersion: state.hintrVersion,
            language: state.language
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
                calibratePlotResult: null
            },
            stepper: rootState.stepper,
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
            // const language = window.localStorage.getItem("language");
            // if (language){
            //     const parsedItem = JSON.parse(item)
            //     parsedItem.
            // }
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
