import {mutations} from "../../app/store/load/mutations";
import {initialLoadState, LoadingState} from "../../app/store/load/load";
import {mockError, mockLoadState} from "../mocks";

describe("Load mutations", () => {
    it("SettingFiles updates loading state correctly", () => {
        const testState = mockLoadState();
        mutations.SettingFiles(testState, null);
        expect(testState.loadingState).toBe(LoadingState.SettingFiles);
    });

    it("UpdatingState updates loading state correctly", () => {
        const testState = mockLoadState();
        mutations.UpdatingState(testState, null);
        expect(testState.loadingState).toBe(LoadingState.UpdatingState);
    });

    it("LoadStateCleared updates loading state correctly and clears error", () => {
        const testState = {
            ...initialLoadState,
            loadError: mockError("TEST ERROR"),
            loadingState: LoadingState.LoadFailed
        };
        mutations.LoadStateCleared(testState, null);
        expect(testState.loadingState).toBe(LoadingState.NotLoading);
        expect(testState.loadError).toBe(null);
    });

    it("LoadFailed updates loading state correctly and sets error", () => {
        const testState = mockLoadState();
        const error = mockError("TEST ERROR");
        mutations.LoadFailed(testState, {type: "LoadFailed", payload: error});
        expect(testState.loadingState).toBe(LoadingState.LoadFailed);
        expect(testState.loadError).toBe(error);
    });
});