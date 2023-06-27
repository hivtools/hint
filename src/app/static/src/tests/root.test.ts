import {localStorageManager} from "../app/localStorageManager";
import Vuex from "vuex";

describe("Root", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("deletes state from explore app, and loads state for main app, from local storage on load", async () => {
        const mockDeleteState = jest.spyOn(localStorageManager, "deleteState");
        const mockGetState = jest.spyOn(localStorageManager, "getState");
        const mockSaveState = jest.spyOn(localStorageManager, "saveState");

        const mockConsoleLog = jest.fn();
        console.log = mockConsoleLog;

        const module = await import("../app/root");
        expect(mockDeleteState).toHaveBeenCalledWith(true);
        expect(mockGetState).toHaveBeenCalledWith(false);

        // Also check persistState plugin is functioning
        expect(mockSaveState).toHaveBeenCalledTimes(0);
        const store = new Vuex.Store(module.storeOptions);
        store.commit({type: "baseline/Ready", payload: null});
        expect(mockConsoleLog.mock.calls[0][0]).toBe("baseline/Ready");
        expect(mockSaveState.mock.calls[0][0]).toStrictEqual(module.storeOptions.state);
    });
});
