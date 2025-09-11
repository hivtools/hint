import {mutations} from "../../app/store/load/mutations";
import {LoadingState} from "../../app/store/load/state";
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
        expect(testState.loadError).toBe(null);
    });

    it("LoadStateCleared updates loading state correctly and clears error", () => {
        const testState = mockLoadState();
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
        expect(testState.rehydrateResult).toEqual({})
    });

    it("set RehydrateResult state", () => {
        const payload = {rehydrateResult: "TEST"} as any
        const testState = mockLoadState();
        mutations.RehydrateResult(testState, {type: "RehydrateResult", payload: payload});
        expect(testState.rehydrateResult).toEqual({"rehydrateResult": "TEST"});
    });

    it("set RehydrateResultError state", () => {
        const error = mockError("TEST ERROR");
        const testState = mockLoadState();
        mutations.RehydrateResultError(testState, {type: "RehydrateResultError", payload: error});
        expect(testState.loadError).toBe(error);
    });

    it("set new Project name state", () => {
        const testState = mockLoadState();
        mutations.SetNewProjectName(testState,  "project name");
        expect(testState.newProjectName).toBe("project name");
    });

    it("StartPreparingRehydrate sets preparing state", () => {
        const testState = mockLoadState();
        mutations.StartPreparingRehydrate(testState, null);
        expect(testState.loadingState).toBe(LoadingState.SettingFiles);
        expect(testState.preparing).toBe(true);
    });

});
