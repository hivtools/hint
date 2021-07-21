import {
    mockAxios,
    mockDownloadResultsState, mockModelCalibrateState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/downloadResults/actions";
import {DOWNLOAD_TYPE} from "../../app/store/downloadResults/downloadResults";

describe(`download Results actions`, () => {

    const statusResponse =  {
        id: "db0c4957aea4b32c507ac02d63930110",
        done: false,
        progress:["Generating summary report"],
        status: "RUNNING",
        success: null,
        queue: 0
    }

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    it("can submit download summary, commits and starts polling", async () => {
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

        mockAxios.onGet(`download/submit/summary/calibrate1`)
            .reply(200, mockSuccess(downloadId));

        await actions.downloadSummary({commit, state, dispatch, rootState: root} as any, false);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe( "IsADRUpload")
        expect(commit.mock.calls[0][0]["payload"]).toBe( false)
        expect(commit.mock.calls[1][0]["type"]).toBe( "SummaryDownloadStarted")
        expect(commit.mock.calls[1][0]["payload"]).toEqual(downloadId)
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("download/submit/summary/calibrate1");

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0]).toEqual( ["poll", DOWNLOAD_TYPE.SUMMARY])
    });

    it("can invoke summary poll action, gets pollId, commits PollingStatusStarted", async (done) => {
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

        mockAxios.onGet(`download/submit/summary/calibrate1`)
            .reply(200, mockSuccess(downloadId));
        mockAxios.onGet(`download/status/1`)
            .reply(200, mockSuccess(statusResponse));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SUMMARY)

            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(statusResponse)
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

        await actions.downloadSpectrum({commit, state, dispatch, rootState: root} as any, false);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe( "IsADRUpload")
        expect(commit.mock.calls[0][0]["payload"]).toBe( false)
        expect(commit.mock.calls[1][0]["type"]).toBe( "SpectrumDownloadStarted")
        expect(commit.mock.calls[1][0]["payload"]).toEqual(downloadId)
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
            .reply(200, mockSuccess(statusResponse));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.SPECTRUM)

            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(statusResponse)
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

        await actions.downloadCoarseOutput({commit, state, dispatch, rootState: root} as any, false);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe( "IsADRUpload")
        expect(commit.mock.calls[0][0]["payload"]).toBe( false)
        expect(commit.mock.calls[1][0]["type"]).toBe( "CoarseOutputDownloadStarted")
        expect(commit.mock.calls[1][0]["payload"]).toEqual(downloadId)
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
            .reply(200, mockSuccess(statusResponse));

        await actions.poll({commit, state, dispatch, rootState: root} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted")
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1)
            expect(commit.mock.calls[0][0]["payload"].downloadType).toEqual(DOWNLOAD_TYPE.COARSE)

            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputDownloadStatusUpdated")
            expect(commit.mock.calls[1][0]["payload"]).toEqual(statusResponse)
            done()
        }, 2100)
    });

})