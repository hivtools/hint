import {localStorageManager} from "../app/localStorageManager";
import {sessionStorageManager} from "../app/sessionStorageManager";
import Vuex from "vuex";

describe("Root", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("loads the user's state for main app, from session storage, when the store is made", async () => {
        const mockGetState = vi.spyOn(sessionStorageManager, "getState");
        const mockSaveState = vi.spyOn(sessionStorageManager, "saveState");
        const mockRemoveLegacyState = vi.spyOn(localStorageManager, "removeLegacyState");

        console.log = vi.fn();

        const module = await import("../app/root");
        // Nothing is read when the file loads: the state belongs to a user, and the app does not know them yet
        expect(mockGetState).not.toHaveBeenCalled();
        const storeOptions = module.createStoreOptions("some.user@example.com");
        expect(mockGetState).toHaveBeenCalledTimes(1);
        expect(mockGetState).toHaveBeenCalledWith("some.user@example.com");
        expect(mockRemoveLegacyState).toHaveBeenCalledTimes(1);
        expect(storeOptions.state).toMatchObject({currentUser: "some.user@example.com"});

        // Also check persistState plugin is functioning
        expect(mockSaveState).toHaveBeenCalledTimes(0);
        const store = new Vuex.Store(storeOptions);
        store.commit({type: "baseline/Ready", payload: null});
        expect(mockSaveState).toHaveBeenCalledTimes(1);
        expect(mockSaveState.mock.calls[0][0]).toStrictEqual(storeOptions.state);

        // persist state doesn't run if project loading is in progress
        store.commit({type: "projects/SetLoadingProject", payload: true});
        expect(mockSaveState).toHaveBeenCalledTimes(1);
        store.commit({type: "baseline/Ready", payload: null});
        expect(mockSaveState).toHaveBeenCalledTimes(1);
    });
});
