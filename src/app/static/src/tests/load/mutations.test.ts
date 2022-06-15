import {mutations} from "../../app/store/load/mutations";
import {LoadingState} from "../../app/store/load/load";
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
    });

    it("set RehydrateResult state", () => {
        const payload = {rehydrateResult: "TEST"} as any
        const testState = mockLoadState();
        mutations.RehydrateResult(testState, {type: "RehydrateResult", payload: payload});
        expect(testState.rehydrateResult).toEqual({"rehydrateResult": "TEST"});
    });

    it("set PreparingModelOutput state", () => {
        const payload = {id: "1"} as any
        const testState = mockLoadState();
        mutations.PreparingModelOutput(testState, {type: "PreparingModelOutput", payload: payload});
        expect(testState.downloadId).toEqual( "1");
    });

    it("set ModelOutputStatusUpdated state", () => {
        const payload = {done: true} as any
        const testState = mockLoadState();
        mutations.ModelOutputStatusUpdated(testState, {type: "ModelOutputStatusUpdated", payload: payload});
        expect(testState.loadError).toEqual(null);
        expect(testState.statusPollId).toEqual(-1);
    });

    it("set PollingStatusStarted state", () => {
        const testState = mockLoadState();
        mutations.PollingStatusStarted(testState, {type: "ModelOutputStatusUpdated", payload: 20});
        expect(testState.loadError).toEqual(null);
        expect(testState.statusPollId).toEqual(20);
    });

    it("set RehydrateResultError state", () => {
        const error = mockError("TEST ERROR");
        const testState = mockLoadState();
        mutations.RehydrateResultError(testState, {type: "RehydrateResultError", payload: error});
        expect(testState.loadError).toBe(error);
        expect(testState.statusPollId).toEqual(-1);
    });

});