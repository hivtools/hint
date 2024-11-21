import {RootState} from "../../root";
import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {DownloadResultsDependency} from "../../types";
import { DownloadType } from "./downloadConfig";

export type DownloadResultsState = {
    [K in DownloadType]: DownloadResultsDependency
}

export const initialDownloadResults = {
    fetchingDownloadId: false,
    downloadId: "",
    preparing: false,
    statusPollId: -1,
    complete: false,
    error: null,
    downloadError: null,
    metadataError: null
}

export const initialDownloadResultsState = (): DownloadResultsState => {
    return Object.fromEntries(
        Object.values(DownloadType).map(downloadBtn => [downloadBtn, {...initialDownloadResults}])
    ) as DownloadResultsState;
}

export const downloadResults: Module<DownloadResultsState, RootState> = {
    namespaced: true,
    state: {...initialDownloadResultsState()},
    actions,
    mutations
}
