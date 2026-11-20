import type {MutationTree} from "vuex";
import type {PayloadWithType} from "../../types";
import type {Error} from "../../generated";
import type {ErrorsState} from "./errors";

export enum ErrorsMutation {
    ErrorAdded = "ErrorAdded",
    DismissAll = "DismissAll",
    ErrorReportError = "ErrorReportError",
    ErrorReportSuccess = "ErrorReportSuccess",
    SendingErrorReport = "SendingErrorReport"
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

    [ErrorsMutation.SendingErrorReport](state: ErrorsState, action: PayloadWithType<boolean>) {
        state.sendingErrorReport = action.payload;
    }
};