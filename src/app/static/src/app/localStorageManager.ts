import {RootState} from "./root";

const appStateKey = "appState";

export const serialiseState = (rootState: RootState): Partial<RootState> => {
    return {
        modelRun: {...rootState.modelRun, statusPollId: -1},
        filteredData: rootState.filteredData,
        stepper: rootState.stepper
    };
};

export class LocalStorageManager {

    saveState = (state: RootState) => {
        const partialState = serialiseState(state);
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
