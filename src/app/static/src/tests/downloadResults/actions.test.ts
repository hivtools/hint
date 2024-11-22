import {
    mockAxios,
    mockDownloadResultsDependency,
    mockDownloadResultsState,
    mockError,
    mockFailure,
    mockMetadataState,
    mockModelCalibrateState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/downloadResults/actions";
import {DownloadStatusResponse} from "../../app/generated";
import {flushPromises} from "@vue/test-utils";
import { DownloadType, downloadPostConfig } from "../../app/store/downloadResults/downloadConfig";
import { DownloadResultsState } from "../../app/store/downloadResults/downloadResults";
import { DownloadResultsMutation } from "../../app/store/downloadResults/mutations";

const RunningStatusResponse: DownloadStatusResponse = {
    id: "db0c4957aea4b32c507ac02d63930110",
    done: false,
    progress: ["Generating summary report"],
    status: "RUNNING",
    success: null,
    queue: 0
}

const   CompleteStatusResponse: DownloadStatusResponse = {
    id: "db0c4957aea4b32c507ac02d63930110",
    done: true,
    progress: ["Generating summary report"],
    status: "COMPLETE",
    success: true,
    queue: 0
}

describe("Single DownloadType action", async () => {
    beforeEach(() => {
        // stop apiService logging to console
        console.log = vi.fn();
        mockAxios.reset();
    });

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    Object.values(DownloadType).forEach(type => testDownloadAction(type));
});

const testDownloadAction = (type: DownloadType) => {
    const mockCalibrateId = "calibrateId";
    const mockDownloadId = "downloadId";
    const mockMetadataError = mockError("METADATA REQUEST FAILED");

    const getStore = (partialDownloadState: Partial<DownloadResultsState>, metadataError = false) => {
        const rootState = mockRootState({
            modelCalibrate: mockModelCalibrateState({ calibrateId: mockCalibrateId }),
            ... metadataError
            ? {
                metadata: mockMetadataState({ adrUploadMetadataError: mockMetadataError })
            }
            : {}
        });
        const rootGetters = { projectState: "mockProjectState" };
        const state = mockDownloadResultsState(partialDownloadState);
        return { commit: vi.fn(), dispatch: vi.fn(), rootState, state, rootGetters };
    };

    it("prepare action commits download id + starts polling for status", async () => {
        const { commit, dispatch, rootState, state, rootGetters } = getStore({});

        const partialDownloadResultsState = mockDownloadResultsDependency({downloadId: "1"});
        const downloadUrl = downloadPostConfig[type].url({ rootState } as any);
        mockAxios.onPost(downloadUrl).reply(200, mockSuccess(partialDownloadResultsState));
        
        await actions.prepareOutput({ commit, state, dispatch, rootState, rootGetters } as any, type);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(DownloadResultsMutation.SetFetchingDownloadId);
        expect(commit.mock.calls[0][0]["payload"]).toEqual(type);
        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.Preparing);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({type, payload: partialDownloadResultsState});
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0]["url"]).toBe(downloadUrl);

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual(["poll", type])
    });

    it("prepare action does not do anything if downloadId is already present", async () => {
        const { commit, state } = getStore({
            [type]: mockDownloadResultsDependency({ downloadId: mockDownloadId })
        });

        await actions.prepareOutput({ commit, state } as any, type);
        expect(mockAxios.history.post.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("prepare action does not do anything if fetchingDownloadId is set", async () => {
        const { commit, state } = getStore({
            [type]: mockDownloadResultsDependency({ fetchingDownloadId: true })
        });

        await actions.prepareOutput({ commit, state } as any, type);
        expect(mockAxios.history.post.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("can poll for status + get pollId + commit result", async () => {
        const { commit, dispatch, state, rootState } = getStore({
            [type]: { downloadId: mockDownloadId, status: CompleteStatusResponse }
        });
        mockAxios.onGet(`download/status/${mockDownloadId}`)
            .reply(200, mockSuccess(RunningStatusResponse));
        actions.poll({ commit, state, dispatch, rootState } as any, type);
        vi.advanceTimersByTime(2000);
        await flushPromises();
        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(DownloadResultsMutation.PollingStatusStarted);
        expect(+commit.mock.calls[0][0]["payload"].payload.pollId).toBeGreaterThan(-1);
        expect(commit.mock.calls[0][0]["payload"].type).toEqual(type);

        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.StatusUpdated)
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({ type, payload: RunningStatusResponse })
    });

    it("does not poll for status when submission is unsuccessful", async () => {
        const { commit, dispatch, state, rootState, rootGetters } = getStore({});

        const failureMessage = "TEST FAILED";
        mockAxios.onPost(downloadPostConfig[type].url({ rootState } as any))
            .reply(500, mockFailure(failureMessage));

        await actions.prepareOutput({ commit, state, dispatch, rootState, rootGetters } as any, type);

        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.Error);
        expect(commit.mock.calls[1][0]["payload"])
            .toStrictEqual({ type, payload: mockError(failureMessage) });
    });

    it("gets adr upload metadata if status is done", async () => {
        const { commit, dispatch, state, rootState } = getStore({
            [type]: mockDownloadResultsDependency({downloadId: mockDownloadId})
        });

        mockAxios.onGet(`download/status/${mockDownloadId}`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({ commit, state, dispatch, rootState } as any, type);
        vi.advanceTimersByTime(2000);
        await flushPromises();
        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.StatusUpdated);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({ type, payload: CompleteStatusResponse });
        expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")

        expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
        expect(dispatch.mock.calls[0][2]).toEqual({root: true})
    });

    it("does not get adr upload metadata error if metadata request is successful",  async () => {
        const { commit, dispatch, state, rootState } = getStore({
            [type]: mockDownloadResultsDependency(
                { metadataError: mockError("test"), downloadId: mockDownloadId}
            )
        });

        mockAxios.onGet(`download/status/${mockDownloadId}`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({ commit, state, dispatch, rootState } as any, type);
        vi.advanceTimersByTime(2000);
        await flushPromises();
        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.StatusUpdated);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({ type, payload: CompleteStatusResponse });
        
        expect(commit.mock.calls[2][0]["type"]).toBe(DownloadResultsMutation.MetadataError);
        expect(commit.mock.calls[2][0]["payload"]).toStrictEqual({ type, payload: null });
        expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
        expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
        expect(dispatch.mock.calls[0][2]).toEqual({root: true})
    });

    it("can get adr upload metadata error for summary if metadata request is unsuccessful", async () => {
        const { commit, dispatch, state, rootState } = getStore({
            [type]: mockDownloadResultsDependency(
                { metadataError: mockError("test"), downloadId: mockDownloadId}
            )
        }, true);

        mockAxios.onGet(`download/status/${mockDownloadId}`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        actions.poll({ commit, state, dispatch, rootState } as any, type);
        vi.advanceTimersByTime(2000);
        await flushPromises();
        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.StatusUpdated);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({ type, payload: CompleteStatusResponse });
        
        expect(commit.mock.calls[2][0]["type"]).toBe(DownloadResultsMutation.MetadataError);
        expect(commit.mock.calls[2][0]["payload"]).toStrictEqual({ type, payload: mockMetadataError });
        expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
        expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
        expect(dispatch.mock.calls[0][2]).toEqual({root: true})
    });

    it("does not continue to poll status when unsuccessful", async () => {
        const { commit, dispatch, state, rootState } = getStore({
            [type]: mockDownloadResultsDependency({downloadId: mockDownloadId})
        });

        const errMsg = "TEST FAILED";
        mockAxios.onGet(`download/status/${mockDownloadId}`)
            .reply(500, mockFailure(errMsg));

        actions.poll({ commit, state, dispatch, rootState } as any, type);
        vi.advanceTimersByTime(2000);
        await flushPromises();
        expect(commit.mock.calls.length).toBe(2);

        expect(commit.mock.calls[0][0]["type"]).toBe(DownloadResultsMutation.PollingStatusStarted);
        expect(+commit.mock.calls[0][0]["payload"].payload.pollId).toBeGreaterThan(-1);
        expect(commit.mock.calls[0][0]["payload"].type).toEqual(type);

        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.Error);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({ type, payload: mockError(errMsg) });
    });

    it("can poll for output status", async () => {
        const { commit, dispatch, state, rootState } = getStore({
            [type]: mockDownloadResultsDependency({downloadId: mockDownloadId})
        });

        mockAxios.onGet(`download/status/${mockDownloadId}`)
            .reply(200, mockSuccess(RunningStatusResponse));

        actions.poll({ commit, state, dispatch, rootState } as any, type);
        vi.advanceTimersByTime(2000);
        await flushPromises();
        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(DownloadResultsMutation.PollingStatusStarted);
        expect(+commit.mock.calls[0][0]["payload"].payload.pollId).toBeGreaterThan(-1);
        expect(commit.mock.calls[0][0]["payload"].type).toEqual(type);

        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.StatusUpdated);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({ type, payload: RunningStatusResponse });
    });
};
