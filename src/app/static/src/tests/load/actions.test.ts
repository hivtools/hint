import {mockAxios, mockError, mockFailure, mockLoadState, mockRootState, mockSuccess} from "../mocks";
import {actions} from "../../app/store/load/actions";
import {LoadingState} from "../../app/store/load/load";
import {addCheckSum} from "../../app/utils";
import {localStorageManager} from "../../app/localStorageManager";

const rootState = mockRootState();

describe("Load actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("load reads blob and dispatches setFiles action", (done) => {
        const dispatch = jest.fn();
        actions.load({dispatch, rootState} as any, new File(["Test File Contents"], "testFile"));

        const interval = setInterval(()=> {
            if (dispatch.mock.calls.length > 0) {
                expect(dispatch.mock.calls[0][0]).toEqual("setFiles");
                expect(dispatch.mock.calls[0][1]).toEqual("Test File Contents");
                clearInterval(interval);
                done();
            }
        });
    });

    it("clears loading state", async () => {
        const commit = jest.fn();
        await actions.clearLoadState({commit, rootState} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "LoadStateCleared", payload: null});
    });

    it("updates store state after successful setFiles post", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const fileContents = addCheckSum('{"files": "TEST FILES", "state": "TEST STATE"}');
        await actions.setFiles({commit, state, dispatch, rootState} as any, fileContents);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});

        //should also hand on to updateState action
        expect(dispatch.mock.calls[0][0]).toEqual("updateStoreState");
        expect(dispatch.mock.calls[0][1]).toStrictEqual("TEST STATE");
    });

    it("calls loadFailed mutation with invalid checksum", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(400, mockFailure("Test error"));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.NotLoading});
        const dispatch = jest.fn();
        const fileContents = '["badchecksum", {"files": "TEST FILES", "state": "TEST STATE"}]';
        await actions.setFiles({commit, state, dispatch, rootState} as any, fileContents);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "LoadFailed",
            payload: {detail: "The file contents are corrupted."}
        });

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("calls loadFailed mutation after unsuccessful setFiles post", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(400, mockFailure("Test error"));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.NotLoading});
        const dispatch = jest.fn();
        const fileContents = addCheckSum('{"files": "TEST FILES", "state": "TEST STATE"}');
        await actions.setFiles({commit, state, dispatch, rootState} as any, fileContents);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "LoadFailed", payload: mockError("Test error")});

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("updateStoreState saves file state to local storage and reloads page", async () => {
        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const mockLocationReload = jest.fn();
        delete window.location;
        window.location = {reload: mockLocationReload} as any;

        const testState = mockRootState();
        await actions.updateStoreState({rootState} as any, testState);

        expect(mockSaveToLocalStorage.mock.calls[0][0]).toBe(testState);
        expect(mockLocationReload.mock.calls.length).toBe(1);
    });
});