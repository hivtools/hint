import {MutationTree} from "vuex";
import {DownloadResultsState, getDownloadType} from "./downloadResults";
import {PayloadWithType, PoolingStarted} from "../../types";
import {DownloadStatusResponse, DownloadSubmitResponse, Error} from "../../generated";

export enum DownloadResultsMutation {
    SummaryDownloadStarted = "SummaryDownloadStarted",
    SpectrumDownloadStarted = "SpectrumDownloadStarted",
    CoarseOutputDownloadStarted = "CoarseOutputDownloadStarted",
    PollingStatusStarted = "PollingStatusStarted",
    SummaryDownloadStatusUpdated = "SummaryDownloadStatusUpdated",
    SpectrumDownloadStatusUpdated = "SpectrumDownloadStatusUpdated",
    CoarseOutputDownloadStatusUpdated = "CoarseOutputDownloadStatusUpdated",
    SummaryError = "SummaryError",
    SpectrumError = "SpectrumError",
    CoarseOutputError = "CoarseOutputError",
    CoarseOutputDownloadComplete = "CoarseOutputDownloadComplete",
    SummaryDownloadComplete = "SummaryDownloadComplete",
    SpectrumDownloadComplete = "SpectrumDownloadComplete"
}

export const mutations: MutationTree<DownloadResultsState> = {
    [DownloadResultsMutation.SummaryDownloadStarted](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        state.summary = downloadStarted(action)
    },

    [DownloadResultsMutation.SpectrumDownloadStarted](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        state.spectrum = downloadStarted(action)
    },

    [DownloadResultsMutation.CoarseOutputDownloadStarted](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        state.coarseOutput = downloadStarted(action)
    },

    [DownloadResultsMutation.CoarseOutputError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.coarseOutput.error = action.payload
        state.coarseOutput.downloading = false

        if (state.coarseOutput.statusPollId > -1) {
            stopPollingCoarse(state);
        }
    },

    [DownloadResultsMutation.SpectrumError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.spectrum.error = action.payload
        state.spectrum.downloading = false

        if (state.spectrum.statusPollId > -1) {
            stopPollingSpectrum(state);
        }
    },

    [DownloadResultsMutation.SummaryError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.summary.error = action.payload
        state.summary.downloading = false

        if (state.summary.statusPollId > -1) {
            stopPollingSummary(state);
        }
    },

    [DownloadResultsMutation.CoarseOutputDownloadStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            stopPollingCoarse(state)
        }
        state.coarseOutput.status = action.payload;
        state.coarseOutput.error = null;
    },

    [DownloadResultsMutation.SummaryDownloadStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            stopPollingSummary(state)
        }
        state.summary.status = action.payload;
        state.summary.error = null;
    },

    [DownloadResultsMutation.SpectrumDownloadStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            stopPollingSpectrum(state)
        }
        state.spectrum.status = action.payload;
        state.spectrum.error = null;
    },

    [DownloadResultsMutation.PollingStatusStarted](state: DownloadResultsState, action: PayloadWithType<PoolingStarted>) {
        switch (action.payload.downloadType) {
            case getDownloadType.spectrum: {
                state.spectrum.statusPollId = action.payload.pollId
                break;
            }
            case getDownloadType.coarse: {
                state.coarseOutput.statusPollId = action.payload.pollId
                break;
            }
            case getDownloadType.summary: {
                state.summary.statusPollId = action.payload.pollId
                break
            }
        }
    },
    [DownloadResultsMutation.CoarseOutputDownloadComplete](state: DownloadResultsState, action: PayloadWithType<boolean>) {
        state.coarseOutput.complete = action.payload;
        state.coarseOutput.downloading = false;
    },

    [DownloadResultsMutation.SummaryDownloadComplete](state: DownloadResultsState, action: PayloadWithType<boolean>) {
        state.summary.complete = action.payload;
        state.summary.downloading = false;
    },

    [DownloadResultsMutation.SpectrumDownloadComplete](state: DownloadResultsState, action: PayloadWithType<boolean>) {
        state.spectrum.complete = action.payload;
        state.spectrum.downloading = false;
    }
};

const downloadStarted = (action: PayloadWithType<DownloadSubmitResponse>) => {
    return {
        downloadId: action.payload.id,
        downloading: true,
        statusPollId: -1,
        status: {} as DownloadStatusResponse,
        complete: false,
        error: null
    }
}

const stopPollingSpectrum = (state: DownloadResultsState) => {
    clearInterval(state.spectrum.statusPollId);
    state.spectrum.statusPollId = -1;
};

const stopPollingCoarse = (state: DownloadResultsState) => {
    clearInterval(state.coarseOutput.statusPollId);
    state.coarseOutput.statusPollId = -1;
};

const stopPollingSummary = (state: DownloadResultsState) => {
    clearInterval(state.summary.statusPollId);
    state.summary.statusPollId = -1;
};