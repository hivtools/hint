import {
    mockAxios, mockDownloadResultsDependency,
    mockDownloadResultsState, mockError, mockFailure, mockModelCalibrateState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/downloadResults/actions";
import {DOWNLOAD_TYPE} from "../../app/types";
import {DownloadStatusResponse} from "../../app/generated";

const RunningStatusResponse: DownloadStatusResponse = {
    id: "db0c4957aea4b32c507ac02d63930110",
    done: false,
    progress: ["Generating summary report"],
    status: "RUNNING",
    success: null,
    queue: 0
}

const CompleteStatusResponse: DownloadStatusResponse = {
    id: "db0c4957aea4b32c507ac02d63930110",
    done: true,
    progress: ["Generating summary report"],
    status: "COMPLETE",
    success: true,
    queue: 0
}

describe(`download Results actions`, () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    it("prepare summary commits download id and starts polling for status", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = mockDownloadResultsDependency({downloadId: "1"});
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"})
        });

        const state = mockDownloadResultsState();

        mockAxios.onGet(`download/submit/summary/calibrate1`)
            .reply(200, mockSuccess(partialDownloadResultsState));

        await actions.prepareSummaryReport({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("PreparingSummaryReport")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(partialDownloadResultsState)
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("download/submit/summary/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual(["poll", DOWNLOAD_TYPE.SUMMARY])
    });

    it("prepare summary does not do anything if downloadId is already present", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            summary: mockDownloadResultsDependency({downloadId: "1"})
        });

        await actions.prepareSummaryReport({commit, state} as any);
        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("can poll for summary status, get pollId and commit result", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn()
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SUMMARY)

            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryReportStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()
        }, 2100)
    });

    it("does not poll for summary status when submission is unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        mockAxios.onGet(`download/submit/summary/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.prepareSummaryReport({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SummaryError",
            payload: mockError("TEST FAILED")
        });
    });

    it("gets adr upload metadata if summary status is done", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            summary: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryReportStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)
            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})
            done()
        }, 2100)
    });

    it("does not continue to poll summary status when unsuccessful", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = mockDownloadResultsDependency({downloadId: "1"});

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState
        });

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)

            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SUMMARY)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "SummaryError",
                payload: mockError("TEST FAILED")
            });
            done()
        }, 2100)
    });

    it("can submit spectrum download request, commits and starts polling", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadId = {downloadId: "1"};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"})
        });

        const state = mockDownloadResultsState();

        mockAxios.onGet(`download/submit/spectrum/calibrate1`)
            .reply(200, mockSuccess(downloadId));

        await actions.prepareSpectrumOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("PreparingSpectrumOutput")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(downloadId)
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("download/submit/spectrum/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual(["poll", DOWNLOAD_TYPE.SPECTRUM])
    });

    it("prepare spectrum does not do anything if downloadId is already present", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        await actions.prepareSpectrumOutput({commit, state} as any);
        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("can invoke spectrum poll action, gets pollId, commits PollingStatusStarted", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()

        }, 2100)
    });

    it("can poll for spectrum output status", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()
        }, 2100)
    });

    it("gets adr upload metadata if spectrum status is done", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)
            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})
            done()
        }, 2100)
    });

    it("does not start polling for spectrum output status when submission is unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        mockAxios.onGet(`download/submit/spectrum/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.prepareSpectrumOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SpectrumError",
            payload: mockError("TEST FAILED")
        });
    });

    it("does not continue to poll spectrum status when unsuccessful", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            spectrum: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)

            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "SpectrumError",
                payload: mockError("TEST FAILED")
            });

            done()

        }, 2100)
    });

    it("can prepare coarse output, commits and starts polling", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadId = {downloadId: "1"};
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        mockAxios.onGet(`download/submit/coarse-output/calibrate1`)
            .reply(200, mockSuccess(downloadId));

        await actions.prepareCoarseOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("PreparingCoarseOutput")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(downloadId)
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("download/submit/coarse-output/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual(["poll", DOWNLOAD_TYPE.COARSE])
    });

    it("prepare coarse output does not do anything if downloadId is already present", async () => {
        const commit = jest.fn();
        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({downloadId: "1"})
        });

        await actions.prepareCoarseOutput({commit, state} as any);
        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("gets adr upload metadata if coarse output status is done", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(CompleteStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(CompleteStatusResponse)
            expect(dispatch.mock.calls[0][0]).toBe("metadata/getAdrUploadMetadata")
            expect(dispatch.mock.calls[0][1]).toBe(CompleteStatusResponse.id)
            expect(dispatch.mock.calls[0][2]).toEqual({root: true})
            done()
        }, 2100)
    });

    it("can invoke coarse output poll action, get pollId and commit PollingStatusStarted", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()
        }, 2100)
    });

    it("can get coarse output status results", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        const state = mockDownloadResultsState({
            coarseOutput: mockDownloadResultsDependency({downloadId: "1"})
        });

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)

            done()
        }, 2100)
    });

    it("does not poll for coarse output status when submission is unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState();

        mockAxios.onGet(`download/submit/coarse-output/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.prepareCoarseOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "CoarseOutputError",
            payload: mockError("TEST FAILED")
        });
    });

    it("does not continue to poll coarse output status when unsuccessful", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = mockDownloadResultsDependency({downloadId: "1"});

        const state = mockDownloadResultsState({
            coarseOutput: partialDownloadResultsState
        });

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.poll({commit, state, dispatch, rootState: mockRootState()} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "CoarseOutputError",
                payload: mockError("TEST FAILED")
            });

            done()
        }, 2100)
    });

})