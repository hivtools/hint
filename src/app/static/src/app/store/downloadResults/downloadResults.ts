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
        spectrum: {...initialDownloadResults},
        coarseOutput: {...initialDownloadResults},
        summary: {...initialDownloadResults}
    }
}

export const downloadResultsGetters = {
    errors: (state: DownloadResultsState) => {
        return [state.spectrum.error, state.coarseOutput.error, state.summary.error]
    }
};

export const downloadResults: Module<DownloadResultsState, RootState> = {
    namespaced: true,
    state: {...initialDownloadResultsState()},
    getters: downloadResultsGetters,
    actions,
    mutations

}