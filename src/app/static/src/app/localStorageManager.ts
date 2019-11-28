import {RootState} from "./root";

const appStateKey = "appState";

export const serialiseState = (rootState: RootState): Partial<RootState> => {
    return {
        modelRun: {...rootState.modelRun, statusPollId: -1, result: null},
        modelOptions: rootState.modelOptions,
        modelOutput: rootState.modelOutput,
        filteredData: rootState.filteredData,
        stepper: rootState.stepper,
        metadata: rootState.metadata,
        plottingSelections: rootState.plottingSelections
    };
};

export class LocalStorageManager {

    saveState = (state: RootState) => {
        const partialState = serialiseState(state);
        this.savePartialState(partialState);
    };

    savePartialState = (partialState: Partial<RootState>) => {
        window.localStorage.setItem(appStateKey, JSON.stringify(partialState));
    };

    getState = () : Partial<RootState> | null => {
        const item = window.localStorage.getItem(appStateKey);
        if (item) {
            return JSON.parse(item) as Partial<RootState>;
        }
        else {
            return null;
        }
    };
}

export const localStorageManager = new LocalStorageManager();
