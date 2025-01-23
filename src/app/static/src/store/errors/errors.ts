import {Module} from "vuex";
import {Error} from "../../generated";
import {mutations} from "./mutations";
import {RootState} from "../../root";

export interface ErrorsState {
    errors: Error[],
    errorReportError: Error | null
    errorReportSuccess: boolean
    sendingErrorReport: boolean
}

export enum ErrorReportDefaultValue {
    calibrate = "no associated calibrateId",
    model = "no associated modelRunId",
    download = "none",
    country = "no associated country",
    project = "no associated project"
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

export const errors: Module<ErrorsState, RootState> = {
    namespaced,
    state: initialErrorsState(),
    mutations
};
