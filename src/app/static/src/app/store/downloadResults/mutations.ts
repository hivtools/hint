import {MutationTree} from "vuex";
import {DownloadResultsState} from "./downloadResults";
import {PayloadWithType} from "../../types";
import {DownloadStatusResponse, DownloadSubmitResponse, Error} from "../../generated";
import { DownloadType } from "./downloadConfig";

export enum DownloadResultsMutation {
    Preparing = "Preparing",
    StatusUpdated = "StatusUpdated",
    Error = "Error",
    MetadataError = "MetadataError",
    DownloadError = "DownloadError",
    SetFetchingDownloadId = "SetFetchingDownloadId",
    PollingStatusStarted = "PollingStatusStarted",
    ResetIds = "ResetIds"
}

type WithDownloadType<Payload> = { type: DownloadType, payload: Payload };

type PollingStarted = {
    pollId: number,
}

export const mutations: MutationTree<DownloadResultsState> = {
    
    [DownloadResultsMutation.Preparing](
        state: DownloadResultsState,
        { payload: { type, payload } }: PayloadWithType<WithDownloadType<DownloadSubmitResponse>>
    ) {
        const downloadId = payload.id;
        state[type] = {
            ...state[type],
            downloadId,
            preparing: true,
            complete: false,
            error: null,
            fetchingDownloadId: false
        }
    },

    [DownloadResultsMutation.StatusUpdated](
        state: DownloadResultsState,
        { payload: { type, payload } }: PayloadWithType<WithDownloadType<DownloadStatusResponse>>
    ) {
        if (payload.done) {
            state[type].complete = true;
            state[type].preparing = false;
            window.clearInterval(state[type].statusPollId);
            state[type].statusPollId = -1;
        }
        state[type].error = null;
    },

    [DownloadResultsMutation.Error](
        state: DownloadResultsState,
        { payload: { type, payload } }: PayloadWithType<WithDownloadType<Error>>
    ) {
        state[type].error = payload;
        state[type].preparing = false;
        state[type].fetchingDownloadId = false;
        window.clearInterval(state[type].statusPollId);
        state[type].statusPollId = -1;
    },

    [DownloadResultsMutation.MetadataError](
        state: DownloadResultsState,
        { payload: { type, payload } }: PayloadWithType<WithDownloadType<Error>>
    ) {
        state[type].metadataError = payload;
    },

    [DownloadResultsMutation.DownloadError](
        state: DownloadResultsState,
        { payload: { type, payload } }: PayloadWithType<WithDownloadType<Error | null>>
    ) {
        state[type].downloadError = payload;
    },

    [DownloadResultsMutation.SetFetchingDownloadId](state: DownloadResultsState, action: PayloadWithType<DownloadType>) {
        state[action.payload] = { ...state[action.payload], fetchingDownloadId: true };
    },

    [DownloadResultsMutation.PollingStatusStarted](
        state: DownloadResultsState,
        { payload: { type, payload } }: PayloadWithType<WithDownloadType<PollingStarted>>) {
        state[type].statusPollId = payload.pollId;
    },

    [DownloadResultsMutation.ResetIds](state: DownloadResultsState) {
        Object.values(DownloadType).forEach(type => {
            state[type].downloadId = "";
            window.clearInterval(state[type].statusPollId);
            state[type].statusPollId = -1;
        });
    }
};
