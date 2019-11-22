import {Module} from "vuex";
import {RootState} from "../../root";
import {mutations} from "./mutations";

export interface ErrorsState {
    errors: String[]
}

export const initialErrorsState = (): ErrorsState => {
    return {
        errors: ["TEST ERROR"]
    }
};

const namespaced: boolean = true;

export const errors: Module<ErrorsState, RootState> = {
    namespaced,
    state: initialErrorsState(),
    mutations
};