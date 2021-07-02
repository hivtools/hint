import {MutationTree} from "vuex";
import {DownloadResultsState} from "./downloadResults";
import {PayloadWithType} from "../../types";
import {CalibrateStatusResponse, DownloadStatusResponse, DownloadSubmitResponse, Error} from "../../generated";

export enum DownloadResultsMutation {
    DownloadStarted = "DownloadStarted",
    DownloadError = "DownloadError",
    DownloadStatusUpdated = "DownloadStatusUpdated",
    PollingStatusStarted = "PollingStatusStarted",
    DownloadComplete = "DownloadComplete"
}

export const mutations: MutationTree<DownloadResultsState> = {
    [DownloadResultsMutation.DownloadStarted](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        state.downloadId = action.payload.id
        state.downloading = true
        state.complete = false
        state.error = null;
        state.status = {} as CalibrateStatusResponse;
    },

    [DownloadResultsMutation.DownloadError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.error = action.payload
        state.downloading = false
        if (state.statusPollId > -1) {
            stopPolling(state);
        }
    },

    [DownloadResultsMutation.DownloadStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if(action.payload.done) {
            stopPolling(state)
        }
        state.status = action.payload;
        state.error = null;
    },

    [DownloadResultsMutation.PollingStatusStarted](state: DownloadResultsState, action: PayloadWithType<number>) {
        state.statusPollId = action.payload
    },

    [DownloadResultsMutation.DownloadComplete](state: DownloadResultsState, action: PayloadWithType<boolean>) {
        state.complete = action.payload;
        state.downloading = false;
    }
};

const stopPolling = (state: DownloadResultsState) => {
    clearInterval(state.statusPollId);
    state.statusPollId = -1;
};