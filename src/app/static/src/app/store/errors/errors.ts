import {Module} from "vuex";
import {Error} from "../../generated";
import {mutations} from "./mutations";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface ErrorsState {
    errors: Error[],
    errorReportError: Error | null
    errorReportSuccess: boolean
    sendingErrorReport: boolean
}

export const initialErrorsState = (): ErrorsState => {
    return {
        errors: [],
        errorReportError: null,
        errorReportSuccess: false,
        sendingErrorReport: false
    }
};

const namespaced = true;

export const errors: Module<ErrorsState, DataExplorationState> = {
    namespaced,
    state: initialErrorsState(),
    mutations
};