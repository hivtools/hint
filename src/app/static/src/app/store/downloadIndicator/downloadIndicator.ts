import {DataExplorationState} from "../dataExploration/dataExploration";
import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";

export interface DownloadIndicatorState {
    downloadingIndicator: boolean
}

export const initialDownloadIndicatorState = (): DownloadIndicatorState => {
    return {
        downloadingIndicator: false
    }
}

const namespaced = true

export const downloadIndicator = (): Module<DownloadIndicatorState, DataExplorationState> => {
    return {
        namespaced,
        state: {...initialDownloadIndicatorState()},
        actions,
        mutations
    }
}