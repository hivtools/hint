import {localStorageManager} from "../app/localStorageManager";
import Vuex from "vuex";

describe("Root", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("deletes state from explore app, and loads state for main app, from local storage on load", async () => {
        const  mockDeleteState = jest.fn();
        localStorageManager.deleteState = mockDeleteState;
        const mockGetState = jest.fn();
        localStorageManager.getState = mockGetState;
        const mockSaveState = jest.fn();
        localStorageManager.saveState = mockSaveState;

        const mockConsoleLog = jest.fn();
        console.log = mockConsoleLog;

        const module = await import("../app/root");
        expect(mockDeleteState.mock.calls[0][0]).toBe(true);
        expect(mockGetState.mock.calls[0][0]).toBe(false);

        // Also check persistState plugin is functioning
        expect(mockSaveState.mock.calls.length).toBe(0);
        const store = new Vuex.Store(module.storeOptions);
        store.commit({type: "baseline/Ready", payload: null});
        expect(mockConsoleLog.mock.calls[0][0]).toBe("baseline/Ready");
        expect(mockSaveState.mock.calls[0][0]).toBe(module.storeOptions.state);
    });
});
