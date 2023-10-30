import {MutationTree} from "vuex";
import {DownloadResultsState} from "./downloadResults";
import {PayloadWithType, PollingStarted, DOWNLOAD_TYPE} from "../../types";
import {DownloadStatusResponse, DownloadSubmitResponse, Error} from "../../generated";

export enum DownloadResultsMutation {
    PreparingSpectrumOutput = "PreparingSpectrumOutput",
    SpectrumOutputStatusUpdated = "SpectrumOutputStatusUpdated",
    SpectrumError = "SpectrumError",
    SpectrumOutputDownloadError = "SpectrumOutputDownloadError",
    PreparingCoarseOutput = "PreparingCoarseOutput",
    CoarseOutputStatusUpdated = "CoarseOutputStatusUpdated",
    CoarseOutputError = "CoarseOutputError",
    CoarseOutputDownloadError = "CoarseOutputDownloadError",
    PreparingSummaryReport = "PreparingSummaryReport",
    SummaryReportStatusUpdated = "SummaryReportStatusUpdated",
    SummaryError = "SummaryError",
    SummaryOutputDownloadError = "SummaryOutputDownloadError",
    PreparingComparisonOutput = "PreparingComparisonOutput",
    ComparisonOutputStatusUpdated = "ComparisonOutputStatusUpdated",
    ComparisonDownloadError = "ComparisonDownloadError",
    ComparisonError = "ComparisonError",
    PreparingAgywTool = "PreparingAgywTool",
    AgywError = "AgywError",
    AgywStatusUpdated = "AgywStatusUpdated",
    AgywDownloadError = "AgywDownloadError",
    SetFetchingDownloadId = "SetFetchingDownloadId",
    PollingStatusStarted = "PollingStatusStarted",
    ResetIds = "ResetIds",
    ComparisonOutputMetadataError = "ComparisonOutputMetadataError",
    SummaryMetadataError = "SummaryMetadataError",
    SpectrumMetadataError = "SpectrumMetadataError",
    CoarseOutputMetadataError = "CoarseOutputMetadataError"
}

export const mutations: MutationTree<DownloadResultsState> = {

    [DownloadResultsMutation.PreparingSpectrumOutput](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.spectrum = {...state.spectrum, downloadId, preparing: true, complete: false, error: null, fetchingDownloadId: false}
    },

    [DownloadResultsMutation.SpectrumOutputStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            state.spectrum.complete = true;
            state.spectrum.preparing = false;
            window.clearInterval(state.spectrum.statusPollId);
            state.spectrum.statusPollId = -1;
        }
        state.spectrum.error = null;
    },

    [DownloadResultsMutation.SpectrumError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.spectrum.error = action.payload;
        state.spectrum.preparing = false;
        state.spectrum.fetchingDownloadId = false;
        window.clearInterval(state.spectrum.statusPollId);
        state.spectrum.statusPollId = -1;
    },

    [DownloadResultsMutation.SpectrumMetadataError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.spectrum.metadataError = action.payload;
    },

    [DownloadResultsMutation.SpectrumOutputDownloadError](state: DownloadResultsState, action: PayloadWithType<Error | null>) {
        state.spectrum.downloadError = action.payload;
    },

    [DownloadResultsMutation.PreparingCoarseOutput](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.coarseOutput = {...state.coarseOutput, downloadId, preparing: true, complete: false, error: null, fetchingDownloadId: false}
    },

    [DownloadResultsMutation.CoarseOutputStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            state.coarseOutput.complete = true;
            state.coarseOutput.preparing = false;
            window.clearInterval(state.coarseOutput.statusPollId);
            state.coarseOutput.statusPollId = -1;
        }
        state.coarseOutput.error = null;
    },

    [DownloadResultsMutation.CoarseOutputError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.coarseOutput.error = action.payload
        state.coarseOutput.preparing = false;
        state.coarseOutput.fetchingDownloadId = false;
        window.clearInterval(state.coarseOutput.statusPollId);
        state.coarseOutput.statusPollId = -1;
    },

    [DownloadResultsMutation.CoarseOutputMetadataError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.coarseOutput.metadataError = action.payload;
    },

    [DownloadResultsMutation.CoarseOutputDownloadError](state: DownloadResultsState, action: PayloadWithType<Error | null>) {
        state.coarseOutput.downloadError = action.payload;
    },

    [DownloadResultsMutation.PreparingSummaryReport](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.summary = {...state.summary, downloadId, preparing: true, complete: false, error: null, fetchingDownloadId: false}
    },

    [DownloadResultsMutation.SummaryReportStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            state.summary.complete = true;
            state.summary.preparing = false;
            window.clearInterval(state.summary.statusPollId);
            state.summary.statusPollId = -1;
        }
        state.summary.error = null;
    },

    [DownloadResultsMutation.SummaryError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.summary.error = action.payload;
        state.summary.preparing = false;
        state.summary.fetchingDownloadId = false;
        window.clearInterval(state.summary.statusPollId);
        state.summary.statusPollId = -1;
    },

    [DownloadResultsMutation.SummaryMetadataError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.summary.metadataError = action.payload;
    },

    [DownloadResultsMutation.SummaryOutputDownloadError](state: DownloadResultsState, action: PayloadWithType<Error | null>) {
        state.summary.downloadError = action.payload;
    },

    [DownloadResultsMutation.PreparingComparisonOutput](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.comparison = {...state.comparison, downloadId, preparing: true, complete: false, error: null, fetchingDownloadId: false}
    },

    [DownloadResultsMutation.ComparisonOutputStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            state.comparison.complete = true;
            state.comparison.preparing = false;
            window.clearInterval(state.comparison.statusPollId);
            state.comparison.statusPollId = -1;
        }
        state.comparison.error = null;
        state.comparison.downloadError = null;
    },

    [DownloadResultsMutation.ComparisonError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.comparison.error = action.payload;
        state.comparison.preparing = false;
        state.comparison.fetchingDownloadId = false;

        if (state.comparison.statusPollId > -1) {
            window.clearInterval(state.comparison.statusPollId);
            state.comparison.statusPollId = -1;
        }
    },
    [DownloadResultsMutation.SetFetchingDownloadId](state: DownloadResultsState, action: PayloadWithType<string>) {
        switch (action.payload) {
            case DOWNLOAD_TYPE.SPECTRUM: {
                state.spectrum = {...state.spectrum, fetchingDownloadId: true}
                break;
            }
            case DOWNLOAD_TYPE.COARSE: {
                state.coarseOutput = {...state.coarseOutput, fetchingDownloadId: true}
                break;
            }
            case DOWNLOAD_TYPE.SUMMARY: {
                state.summary = {...state.summary, fetchingDownloadId: true}
                break
            }
            case DOWNLOAD_TYPE.COMPARISON: {
                state.comparison = {...state.comparison, fetchingDownloadId: true}
                break
            }
            case DOWNLOAD_TYPE.AGYW: {
                state.agyw = {...state.agyw, fetchingDownloadId: true}
                break
            }
        }
    },

    [DownloadResultsMutation.ComparisonOutputMetadataError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.comparison.metadataError = action.payload;
    },

    [DownloadResultsMutation.ComparisonDownloadError](state: DownloadResultsState, action: PayloadWithType<Error | null>) {
        state.comparison.downloadError = action.payload;
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
            case DOWNLOAD_TYPE.COMPARISON: {
                state.comparison.statusPollId = action.payload.pollId
                break
            }
            case DOWNLOAD_TYPE.AGYW: {
                state.agyw.statusPollId = action.payload.pollId
                break;
            }
        }
    },

    [DownloadResultsMutation.ResetIds](state: DownloadResultsState) {
        const files = [state.spectrum, state.summary, state.coarseOutput,
            state.comparison, state.agyw];
        files.forEach((file) => {
            file.downloadId = "";
            window.clearInterval(file.statusPollId);
            file.statusPollId = -1
        })
    },

    [DownloadResultsMutation.PreparingAgywTool](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.agyw = {...state.agyw, downloadId, preparing: true, complete: false, error: null, fetchingDownloadId: false}
    },

    [DownloadResultsMutation.AgywError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.agyw.error = action.payload
        state.agyw.preparing = false;
        state.agyw.fetchingDownloadId = false;
        window.clearInterval(state.agyw.statusPollId);
        state.agyw.statusPollId = -1;
    },

    [DownloadResultsMutation.AgywStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            state.agyw.complete = true;
            state.agyw.preparing = false;
            window.clearInterval(state.agyw.statusPollId);
            state.agyw.statusPollId = -1;
        }
        state.agyw.error = null;
    },

    [DownloadResultsMutation.AgywDownloadError](state: DownloadResultsState, action: PayloadWithType<Error | null>) {
        state.agyw.downloadError = action.payload;
    },
};
