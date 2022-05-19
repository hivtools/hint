import {RootState} from "../../root";
import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {DownloadResultsDependency} from "../../types";

export interface DownloadResultsState {
    spectrum: DownloadResultsDependency
    coarseOutput: DownloadResultsDependency
    summary: DownloadResultsDependency
    comparison: DownloadResultsDependency
}

export const initialDownloadResults = {
    fetchingDownloadId: false,
    downloadId: "",
    preparing: false,
    statusPollId: -1,
    complete: false,
    error: null
}

export const initialDownloadResultsState = (): DownloadResultsState => {
    return {
        spectrum: {...initialDownloadResults},
        coarseOutput: {...initialDownloadResults},
        summary: {...initialDownloadResults},
        comparison: {...initialDownloadResults}
    }
}

export const downloadResults: Module<DownloadResultsState, RootState> = {
    namespaced: true,
    state: {...initialDownloadResultsState()},
    actions,
    mutations
}