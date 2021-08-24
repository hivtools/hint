import {RootState} from "../../root";
import {DownloadStatusResponse} from "../../generated";
import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {DownloadResultsDependency} from "../../types";

export interface DownloadResultsState {
    spectrum: DownloadResultsDependency
    coarseOutput: DownloadResultsDependency
    summary: DownloadResultsDependency
}

export const initialDownloadResults = {
    downloadId: "",
    downloading: false,
    statusPollId: -1,
    status: {} as DownloadStatusResponse,
    complete: false,
    error: null
}

export enum DOWNLOAD_TYPE {
    SPECTRUM = "Spectrum",
    COARSE = "CoarseOutput",
    SUMMARY = "Summary"
}

export const initialDownloadResultsState = (): DownloadResultsState => {
    return {
        spectrum: JSON.parse(JSON.stringify(initialDownloadResults)),
        coarseOutput: JSON.parse(JSON.stringify(initialDownloadResults)),
        summary: JSON.parse(JSON.stringify(initialDownloadResults))
    }
}

export const downloadResults: Module<DownloadResultsState, RootState> = {
    namespaced: true,
    state: {...initialDownloadResultsState()},
    actions,
    mutations

}