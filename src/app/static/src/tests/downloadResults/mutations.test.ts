import {
    mockDownloadResultsState, mockError
} from "../mocks";
import {mutations} from "../../app/store/downloadResults/mutations";
import {DownloadResultsMutation} from "../../app/store/downloadResults/mutations";
import {DOWNLOAD_TYPE} from "../../app/store/downloadResults/downloadResults";
import {CompleteStatusResponse, RunningStatusResponse} from "./actions.test";

describe(`download results mutations`, () => {

    const downloadStartedPayload = {id: "P123"}
    const error = mockError("TEST FAILED")
    const errorMsg = {detail: "TEST FAILED", error: "OTHER_ERROR"}

    it("sets summary download started on SummaryDownloadStarted", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.SummaryDownloadStarted](state, {payload: downloadStartedPayload});
        expect(state.summary.downloading).toBe(true);
        expect(state.summary.downloadId).toBe("P123");
        expect(state.summary.complete).toBe(false);
        expect(state.summary.error).toBe(null);
    });

    it("sets summary download error on SummaryError", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.SummaryError](state, {payload: error});
        expect(state.summary.downloading).toBe(false);
        expect(state.summary.error).toEqual(errorMsg);
        expect(state.spectrum.error).toBe(null);
        expect(state.coarseOutput.error).toBe(null);
    });

    it("sets poll started for summary download on PollingStatusStarted", () => {
        const state = mockDownloadResultsState();
        const payload = {pollId: 123, downloadType: DOWNLOAD_TYPE.SUMMARY}
        mutations[DownloadResultsMutation.PollingStatusStarted](state, {payload: payload});
        expect(state.summary.statusPollId).toBeGreaterThan(-1);
    });

    it("set summary download status update to complete on SummaryDownloadStatusUpdated", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.SummaryDownloadStatusUpdated](state, {payload: CompleteStatusResponse});
        expect(state.summary.downloading).toBe(false);
        expect(state.summary.complete).toBe(true);
        expect(state.summary.error).toBe(null);
    });

    it("sets spectrum download started on SpectrumDownloadStarted", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.SpectrumDownloadStarted](state, {payload: downloadStartedPayload});
        expect(state.spectrum.downloading).toBe(true);
        expect(state.spectrum.downloadId).toBe("P123");
        expect(state.spectrum.complete).toBe(false);
        expect(state.spectrum.error).toBe(null);
    });

    it("sets spectrum download error on SpectrumError", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.SpectrumError](state, {payload: error});
        expect(state.spectrum.downloading).toBe(false);
        expect(state.spectrum.error).toEqual(errorMsg);
        expect(state.coarseOutput.error).toBe(null);
        expect(state.summary.error).toBe(null);
    });

    it("sets poll started for spectrum download on PollingStatusStarted", () => {
        const state = mockDownloadResultsState();
        const payload = {pollId: 123, downloadType: DOWNLOAD_TYPE.SPECTRUM}
        mutations[DownloadResultsMutation.PollingStatusStarted](state, {payload: payload});
        expect(state.spectrum.statusPollId).toBeGreaterThan(-1);
    });

    it("set spectrum download status update to complete on SpectrumDownloadStatusUpdated", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.SpectrumDownloadStatusUpdated](state, {payload: CompleteStatusResponse});
        expect(state.spectrum.complete).toBe(true);
        expect(state.spectrum.downloading).toBe(false);
        expect(state.spectrum.error).toBe(null);
    });

    it("sets coarseOutput download started on CoarseOutputDownloadStarted", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.CoarseOutputDownloadStarted](state, {payload: downloadStartedPayload});
        expect(state.coarseOutput.downloading).toBe(true);
        expect(state.coarseOutput.downloadId).toBe("P123");
        expect(state.coarseOutput.complete).toBe(false);
        expect(state.coarseOutput.error).toBe(null);
    });

    it("sets coarseOutput download error on CoarseOutputError", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.CoarseOutputError](state, {payload: error});
        expect(state.coarseOutput.downloading).toBe(false);
        expect(state.coarseOutput.error).toEqual(errorMsg);
        expect(state.spectrum.error).toBe(null);
        expect(state.summary.error).toBe(null);
    });

    it("sets poll started for coarseOutput download on PollingStatusStarted", () => {
        const state = mockDownloadResultsState();
        const payload = {pollId: 123, downloadType: DOWNLOAD_TYPE.COARSE}
        mutations[DownloadResultsMutation.PollingStatusStarted](state, {payload: payload});
        expect(state.coarseOutput.statusPollId).toBeGreaterThan(-1);
    });

    it("set coarseOutput download status update to complete on CoarseOutputDownloadStatusUpdated", () => {
        const state = mockDownloadResultsState();
        mutations[DownloadResultsMutation.CoarseOutputDownloadStatusUpdated](state, {payload: CompleteStatusResponse});
        expect(state.coarseOutput.complete).toBe(true);
        expect(state.coarseOutput.downloading).toBe(false);
        expect(state.coarseOutput.error).toBe(null);
    });

})