import {actions} from "../../app/store/downloadResults/actions";
import {rootState} from "./integrationTest";
import {
    DOWNLOAD_TYPE
} from "../../app/store/downloadResults/downloadResults";

describe(`download results actions integration`, () => {

    it(`can send summary download request`, async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = {
            ...rootState,
            modelCalibrate: {calibrateId: "calibrate123"}
        };

        await actions.downloadSummary({commit, dispatch, rootState: root} as any);

        // passing an invalid calibrateId so this will return an error
        // but the expected error message confirms
        // that we're hitting the correct endpoint
        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("SummaryError");
        expect(commit.mock.calls[0][0]["payload"].detail).toBe("Failed to fetch result");
    })

    it(`can poll summary download for status update`, async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = {
            ...rootState,
            modelCalibrate: {calibrateId: "calibrate123"}
        };

        const state = {summary: {downloadId: 123}}

        await actions.poll({commit, dispatch, state, rootState: root} as any, DOWNLOAD_TYPE.SUMMARY);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted");
            expect(commit.mock.calls[0][0]["payload"].downloadType).toBe(DOWNLOAD_TYPE.SUMMARY);
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1);

            expect(commit.mock.calls[1][0]["type"]).toBe("SummaryDownloadStatusUpdated");
            expect(commit.mock.calls[1][0]["payload"].status).toBe("MISSING");
            done()

        }, 2100)
    })

    it(`can send spectrum download request`, async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = {
            ...rootState,
            modelCalibrate: {calibrateId: "calibrate123"}
        };

        await actions.downloadSpectrum({commit, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("SpectrumError");
        expect(commit.mock.calls[0][0]["payload"].detail).toBe("Failed to fetch result");
    })

    it(`can poll spectrum download for status update`, async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = {
            ...rootState,
            modelCalibrate: {calibrateId: "calibrate123"}
        };

        const state = {spectrum: {downloadId: 123}}

        await actions.poll({commit, dispatch, state, rootState: root} as any, DOWNLOAD_TYPE.SPECTRUM);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted");
            expect(commit.mock.calls[0][0]["payload"].downloadType).toBe(DOWNLOAD_TYPE.SPECTRUM);
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1);

            expect(commit.mock.calls[1][0]["type"]).toBe("SpectrumDownloadStatusUpdated");
            expect(commit.mock.calls[1][0]["payload"].status).toBe("MISSING");
            done()

        }, 2100)
    })

    it(`can send coarseOutput download request`, async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = {
            ...rootState,
            modelCalibrate: {calibrateId: "calibrate123"}
        };

        await actions.downloadCoarseOutput({commit, dispatch, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("CoarseOutputError");
        expect(commit.mock.calls[0][0]["payload"].detail).toBe("Failed to fetch result");
    })

    it(`can poll coarseOutput download for status update`, async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = {
            ...rootState,
            modelCalibrate: {calibrateId: "calibrate123"}
        };

        const state = {coarseOutput: {downloadId: 123}}

        await actions.poll({commit, dispatch, state, rootState: root} as any, DOWNLOAD_TYPE.COARSE);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]["type"]).toBe("PollingStatusStarted");
            expect(commit.mock.calls[0][0]["payload"].downloadType).toBe(DOWNLOAD_TYPE.COARSE);
            expect(commit.mock.calls[0][0]["payload"].pollId).toBeGreaterThan(-1);

            expect(commit.mock.calls[1][0]["type"]).toBe("CoarseOutputDownloadStatusUpdated");
            expect(commit.mock.calls[1][0]["payload"].status).toBe("MISSING");
            done()

        }, 2100)
    })
})