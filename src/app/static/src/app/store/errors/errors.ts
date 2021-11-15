import {Module} from "vuex";
import {Error} from "../../generated";
import {mutations} from "./mutations";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface ErrorsState {
    errors: Error[]
}

export const initialErrorsState = (): ErrorsState => {
    return {
        errors: []
    }
};

const namespaced = true;

export const errors: Module<ErrorsState, DataExplorationState> = {
    namespaced,
    state: initialErrorsState(),
    mutations
};