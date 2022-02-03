import {MutationTree} from "vuex";
import {DownloadResultsState} from "./downloadResults";
import {PayloadWithType, PollingStarted, DOWNLOAD_TYPE} from "../../types";
import {DownloadStatusResponse, DownloadSubmitResponse, Error} from "../../generated";

export enum DownloadResultsMutation {
    PreparingSpectrumOutput = "PreparingSpectrumOutput",
    SpectrumOutputStatusUpdated = "SpectrumOutputStatusUpdated",
    SpectrumError = "SpectrumError",
    PreparingCoarseOutput = "PreparingCoarseOutput",
    CoarseOutputStatusUpdated = "CoarseOutputStatusUpdated",
    CoarseOutputError = "CoarseOutputError",
    PreparingSummaryReport = "PreparingSummaryReport",
    SummaryReportStatusUpdated = "SummaryReportStatusUpdated",
    SummaryError = "SummaryError",
    PollingStatusStarted = "PollingStatusStarted",
    ResetIds = "ResetIds"
}

export const mutations: MutationTree<DownloadResultsState> = {

    [DownloadResultsMutation.PreparingSpectrumOutput](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.spectrum = {...state.spectrum, downloadId, preparing: true, complete: false, error: null}
    },

    [DownloadResultsMutation.SpectrumOutputStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            state.spectrum.complete = true;
            state.spectrum.preparing = false;
            clearInterval(state.spectrum.statusPollId);
            state.spectrum.statusPollId = -1;
        }
        state.spectrum.error = null;
    },

    [DownloadResultsMutation.SpectrumError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.spectrum.error = action.payload;
        state.spectrum.preparing = false;
        clearInterval(state.spectrum.statusPollId);
        state.spectrum.statusPollId = -1;
    },

    [DownloadResultsMutation.PreparingCoarseOutput](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.coarseOutput = {...state.coarseOutput, downloadId, preparing: true, complete: false, error: null}
    },

    [DownloadResultsMutation.CoarseOutputStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            state.coarseOutput.complete = true;
            state.coarseOutput.preparing = false;
            clearInterval(state.coarseOutput.statusPollId);
            state.coarseOutput.statusPollId = -1;
        }
        state.coarseOutput.error = null;
    },

    [DownloadResultsMutation.CoarseOutputError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.coarseOutput.error = action.payload
        state.coarseOutput.preparing = false;
        clearInterval(state.coarseOutput.statusPollId);
        state.coarseOutput.statusPollId = -1;
    },

    [DownloadResultsMutation.PreparingSummaryReport](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.summary = {...state.summary, downloadId, preparing: true, complete: false, error: null}
    },

    [DownloadResultsMutation.SummaryReportStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            state.summary.complete = true;
            state.summary.preparing = false;
            clearInterval(state.summary.statusPollId);
            state.summary.statusPollId = -1;
        }
        state.summary.error = null;
    },

    [DownloadResultsMutation.SummaryError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.summary.error = action.payload;
        state.summary.preparing = false;
        clearInterval(state.summary.statusPollId);
        state.summary.statusPollId = -1;
    },

    [DownloadResultsMutation.PollingStatusStarted](state: DownloadResultsState, action: PayloadWithType<PollingStarted>) {
        switch (action.payload.downloadType) {
            case DOWNLOAD_TYPE.SPECTRUM: {
                state.spectrum.statusPollId = action.payload.pollId
                break;
            }
            case DOWNLOAD_TYPE.COARSE: {
                state.coarseOutput.statusPollId = action.payload.pollId
                break;
            }
            case DOWNLOAD_TYPE.SUMMARY: {
                state.summary.statusPollId = action.payload.pollId
                break
            }
        }
    },

    [DownloadResultsMutation.ResetIds](state: DownloadResultsState) {
        state.summary.downloadId = "";
        state.spectrum.downloadId = "";
        state.coarseOutput.downloadId = "";
    }
};