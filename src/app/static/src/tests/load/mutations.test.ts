import {mutations} from "../../app/store/load/mutations";
import {LoadingState, initialLoadState} from "../../app/store/load/load";

describe("Load mutations", () => {
    it("SettingFiles updates loading state correctly", () => {
        const testState = {...initialLoadState};
        mutations.SettingFiles(testState, null);
        expect(testState.loadingState).toBe(LoadingState.SettingFiles);
    });

    it("UpdatingState updates loading state correctly", () => {
        const testState = {...initialLoadState};
        mutations.UpdatingState(testState, null);
        expect(testState.loadingState).toBe(LoadingState.UpdatingState);
    });

    it("LoadStateCleared updates loading state correctly and clears error", () => {
        const testState = {
            ...initialLoadState,
            loadError: "TEST ERROR",
            loadingState: LoadingState.LoadFailed
        };
        mutations.LoadStateCleared(testState, null);
        expect(testState.loadingState).toBe(LoadingState.NotLoading);
        expect(testState.loadError).toBe("");
    });

    it("LoadFailed updates loading state correctly and sets error", () => {
        const testState = {...initialLoadState};
        mutations.LoadFailed(testState, {type: "LoadFailed", payload: "TEST ERROR"});
        expect(testState.loadingState).toBe(LoadingState.LoadFailed);
        expect(testState.loadError).toBe("TEST ERROR");
    });
});