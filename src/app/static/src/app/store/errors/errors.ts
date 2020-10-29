import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";
import {mutations} from "./mutations";

export interface ErrorsState {
    errors: Error[]
}

export const initialErrorsState = (): ErrorsState => {
    return {
        errors: []
    }
};

const namespaced = true;

export const errors: Module<ErrorsState, RootState> = {
    namespaced,
    state: initialErrorsState(),
    mutations
};