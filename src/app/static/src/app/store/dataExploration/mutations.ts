import {MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {mutations as languageMutations} from "../language/mutations";
import {Error} from "../../generated";
import {DataExplorationState} from "./dataExploration";

export enum DataExplorationMutation {
    ErrorReportError = "ErrorReportError",
    ErrorReportSuccess = "ErrorReportSuccess"
}

export const mutations: MutationTree<DataExplorationState> = {

    [DataExplorationMutation.ErrorReportError](state: DataExplorationState, action: PayloadWithType<Error>) {
        state.errorReportError = action.payload;
        state.errorReportSuccess = false;
    },

    [DataExplorationMutation.ErrorReportSuccess](state: DataExplorationState) {
        state.errorReportSuccess = true;
        state.errorReportError = null
    },

    ...languageMutations
};
