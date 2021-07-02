import {ReadyState, RootState} from "../../root";
import {DownloadStatusResponse, Error} from "../../generated";
import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";


export interface DownloadResultsState extends ReadyState {
    downloadId: string
    downloading: boolean
    statusPollId: number
    status: DownloadStatusResponse
    complete: boolean
    error: Error | null
}

export const initialDownloadResultsState = (): DownloadResultsState => {
    return {
        downloading: false,
        statusPollId: -1,
        complete: false,
        error: null,
        ready: false,
        status: {} as DownloadStatusResponse,
        downloadId: ""

    }
}

const namespaced = true;

const existingState = localStorageManager.getState();

export const downloadResults : Module<DownloadResultsState, RootState> = {
    namespaced,
    state: {...initialDownloadResultsState(), ...existingState && existingState.downloadResults, ready: false},
    mutations,
    actions
}