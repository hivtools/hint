import {MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {Error} from "../../generated";
import {ErrorsState} from "./errors";

export enum ErrorsMutation {
    ErrorAdded = "ErrorAdded",
    DismissAll = "DismissAll",
    ErrorReportError = "ErrorReportError",
    ErrorReportSuccess = "ErrorReportSuccess"
}

export const mutations: MutationTree<ErrorsState> = {

    [ErrorsMutation.ErrorAdded](state: ErrorsState, action: PayloadWithType<Error>) {
        state.errors.push(action.payload);
    },

    [ErrorsMutation.DismissAll](state: ErrorsState) {
        state.errors = [];
    },

    [ErrorsMutation.ErrorReportError](state: ErrorsState, action: PayloadWithType<Error>) {
        state.errorReportError = action.payload;
        state.errorReportSuccess = false;
    },

    [ErrorsMutation.ErrorReportSuccess](state: ErrorsState) {
        state.errorReportSuccess = true;
        state.errorReportError = null;
    },
};