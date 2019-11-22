import {MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {ErrorsState} from "./errors";
import {BaselineState} from "../baseline/baseline";
import {BaselineMutation} from "../baseline/mutations";


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