import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";
import {mutations} from "./mutations";

export interface ErrorsState {
    errors: Error[],
    errorReportError: Error | null
    errorReportSuccess: boolean
}

export const initialErrorsState = (): ErrorsState => {
    return {
        errors: [],
        errorReportError: null,
        errorReportSuccess: false,
    }
};

const namespaced = true;

export const errors: Module<ErrorsState, RootState> = {
    namespaced,
    state: initialErrorsState(),
    mutations
};