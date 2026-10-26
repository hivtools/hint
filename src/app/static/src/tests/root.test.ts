import {localStorageManager} from "../app/localStorageManager";
import {sessionStorageManager} from "../app/sessionStorageManager";
import Vuex from "vuex";

describe("Root", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("loads state for main app, from session storage on load", async () => {
        const mockGetState = vi.spyOn(sessionStorageManager, "getState");
        const mockSaveState = vi.spyOn(sessionStorageManager, "saveState");
        const mockRemoveLegacyState = vi.spyOn(localStorageManager, "removeLegacyState");

        console.log = vi.fn();

        const module = await import("../app/root");
        expect(mockGetState).toHaveBeenCalledTimes(1);
        expect(mockRemoveLegacyState).toHaveBeenCalledTimes(1);

        // Also check persistState plugin is functioning
        expect(mockSaveState).toHaveBeenCalledTimes(0);
        const store = new Vuex.Store(module.storeOptions);
        store.commit({type: "baseline/Ready", payload: null});
        expect(mockSaveState).toHaveBeenCalledTimes(1);
        expect(mockSaveState.mock.calls[0][0]).toStrictEqual(module.storeOptions.state);

        // persist state doesn't run if project loading is in progress
        store.commit({type: "projects/SetLoadingProject", payload: true});
        expect(mockSaveState).toHaveBeenCalledTimes(1);
        store.commit({type: "baseline/Ready", payload: null});
        expect(mockSaveState).toHaveBeenCalledTimes(1);
    });
});
