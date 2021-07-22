import {
    mockAxios,
    mockDownloadResultsState, mockError, mockFailure, mockModelCalibrateState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/downloadResults/actions";
import {DOWNLOAD_TYPE} from "../../app/store/downloadResults/downloadResults";


export const RunningStatusResponse = {
    id: "db0c4957aea4b32c507ac02d63930110",
    done: false,
    progress: ["Generating summary report"],
    status: "RUNNING",
    success: null,
    queue: 0
}

export const CompleteStatusResponse =  {
    id: "db0c4957aea4b32c507ac02d63930110",
    done: true,
    progress:["Generating summary report"],
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

    it("can submit download summary, commits and starts polling", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1"};
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"})
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/submit/summary/calibrate1`)
            .reply(200, mockSuccess(partialDownloadResultsState));

        await actions.downloadSummary({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe( "SummaryDownloadStarted")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(partialDownloadResultsState)
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("download/submit/summary/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual( ["poll", DOWNLOAD_TYPE.SUMMARY])
    });

    it("can invoke summary poll action, gets pollId, commits PollingStatusStarted", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1"};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/submit/summary/calibrate1`)
            .reply(200, mockSuccess(partialDownloadResultsState));
        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SUMMARY)

            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()

        }, 2100)
    });

    it("can get summary results, commits and dispatch upload metadata", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));
        mockAxios.onGet(`/meta/adr/1`)
            .reply(200, mockSuccess({type: "summary", description: "summary"}))

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SUMMARY)

            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)

            expect(commit.mock.calls[2][0]["type"]).toBe("SummaryDownloadComplete")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(true)

            expect(dispatch.mock.calls.length).toBe(1)
            expect(dispatch.mock.calls[0]).toEqual(["metadata/getAdrUploadMetadata", "1", {"root": true}])
            done()

        }, 3100)
    });

    it("does not send download summary request when unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/submit/summary/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.downloadSummary({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SummaryError",
            payload: mockError("TEST FAILED")
        });
    });

    it("does not continue to poll summary status when unsuccessful", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3)

            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SUMMARY)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "SummaryError",
                payload: mockError("TEST FAILED")
            });

            expect(commit.mock.calls[2][0]["type"]).toBe("SummaryDownloadComplete")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(true)
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

        const state = mockDownloadResultsState({
            summary: downloadId,
            spectrum: downloadId,
            coarseOutput: downloadId
        } as any);

        mockAxios.onGet(`download/submit/spectrum/calibrate1`)
            .reply(200, mockSuccess(downloadId));

        await actions.downloadSpectrum({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe( "SpectrumDownloadStarted")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(downloadId)
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("download/submit/spectrum/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual( ["poll", DOWNLOAD_TYPE.SPECTRUM])
    });

    it("can invoke spectrum poll action, gets pollId, commits PollingStatusStarted", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadId = {downloadId: "1"};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: downloadId,
            spectrum: downloadId,
            coarseOutput: downloadId
        } as any);

        mockAxios.onGet(`download/submit/spectrum/calibrate1`)
            .reply(200, mockSuccess(downloadId));
        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()

        }, 2100)
    });

    it("can get spectrum results, commits and dispatch upload metadata", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));
        mockAxios.onGet(`/meta/adr/1`)
            .reply(200, mockSuccess({type: "spectrum", description: "spectrum"}))

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)

            expect(commit.mock.calls[2][0]["type"]).toBe("SpectrumDownloadComplete")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(true)

            expect(dispatch.mock.calls.length).toBe(1)
            expect(dispatch.mock.calls[0]).toEqual(["metadata/getAdrUploadMetadata", "1", {"root": true}])
            done()

        }, 3100)
    });

    it("does not send download spectrum request when unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/submit/spectrum/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.downloadSpectrum({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SpectrumError",
            payload: mockError("TEST FAILED")
        });
    });

    it("does not continue to poll spectrum status when unsuccessful", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};

        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3)

            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "SpectrumError",
                payload: mockError("TEST FAILED")
            });

            expect(commit.mock.calls[2][0]["type"]).toBe("SpectrumDownloadComplete")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(true)
            done()

        }, 2100)
    });

    it("can submit coarse-output download request, commits and starts polling", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadId = {downloadId: "1"};
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: downloadId,
            spectrum: downloadId,
            coarseOutput: downloadId
        } as any);

        mockAxios.onGet(`download/submit/coarse-output/calibrate1`)
            .reply(200, mockSuccess(downloadId));

        await actions.downloadCoarseOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe( "CoarseOutputDownloadStarted")
        expect(commit.mock.calls[0][0]["payload"]).toEqual(downloadId)
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("download/submit/coarse-output/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual( ["poll", DOWNLOAD_TYPE.COARSE])
    });

    it("can invoke coarse output poll action, gets pollId, commits PollingStatusStarted", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadId = {downloadId: "1"};
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: downloadId,
            spectrum: downloadId,
            coarseOutput: downloadId
        } as any);

        mockAxios.onGet(`download/submit/coarse-output/calibrate1`)
            .reply(200, mockSuccess(downloadId));
        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)
            done()
        }, 2100)
    });

    it("can get coarse output results,commits and dispatch upload metadata", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const downloadStateMetadata = {downloadId: "1", status: CompleteStatusResponse};
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: downloadStateMetadata,
            spectrum: downloadStateMetadata,
            coarseOutput: downloadStateMetadata
        } as any);

        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));
        mockAxios.onGet(`/meta/adr/1`)
            .reply(200, mockSuccess({type: "coarse_output", description: "coarseOutput"}))

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(RunningStatusResponse)

            expect(commit.mock.calls[2][0]["type"]).toBe("CoarseOutputDownloadComplete")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(true)

            expect(dispatch.mock.calls.length).toBe(1)
            expect(dispatch.mock.calls[0]).toEqual(["metadata/getAdrUploadMetadata", "1", {"root": true}])

            done()
        }, 3100)
    });

    it("does not send download coarse output request when unsuccessful", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/submit/coarse-output/calibrate1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.downloadCoarseOutput({commit, state, dispatch, rootState: root} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "CoarseOutputError",
            payload: mockError("TEST FAILED")
        });
    });

    it("does not continue to poll coarse output status when unsuccessful", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const partialDownloadResultsState = {downloadId: "1", status: CompleteStatusResponse};
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calibrate1"}),
        });

        const state = mockDownloadResultsState({
            summary: partialDownloadResultsState,
            spectrum: partialDownloadResultsState,
            coarseOutput: partialDownloadResultsState
        } as any);

        mockAxios.onGet(`download/status/1`)
            .reply(500, mockFailure("TEST FAILED"));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3)

            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "CoarseOutputError",
                payload: mockError("TEST FAILED")
            });

            expect(commit.mock.calls[2][0]["type"]).toBe("CoarseOutputDownloadComplete")
            expect(commit.mock.calls[2][0]["payload"]).toEqual(true)

            done()
        }, 2100)
    });

})