import {RootState, serialiseState} from "./root";

const appStateKey = "appState";

export class LocalStorageManager {

    saveState = (state: RootState) => {
        const partialState = serialiseState(state);
        window.localStorage.setItem(appStateKey, JSON.stringify(partialState));
    };

    removeState = () => {
        window.localStorage.removeItem(appStateKey);
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
