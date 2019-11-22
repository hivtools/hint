import {MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {ErrorsState} from "./errors";

export enum ErrorsMutation {
    ErrorAdded = "ErrorAdded",
    DismissAll = "DismissAll"
}

export const mutations: MutationTree<ErrorsState> = {

    [ErrorsMutation.ErrorAdded](state: ErrorsState, action: PayloadWithType<string>) {
        state.errors.push(action.payload);
    },

    [ErrorsMutation.DismissAll](state: ErrorsState, action: PayloadWithType<null>) {
        state.errors = [];
    }
};