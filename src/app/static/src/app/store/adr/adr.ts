import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";
import {ADRSchemas} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {BaselineState} from "../baseline/baseline";

export interface ADRState {
    datasets: any[],
    releases: any[],
    fetchingDatasets: boolean,
    key: string | null,
    keyError: Error | null,
    adrError: Error | null,
    schemas: ADRSchemas | null,
    userCanUpload: boolean
}

export const initialADRState = (): ADRState => {
    return {
        datasets: [],
        releases: [],
        key: null,
        keyError: null,
        adrError: null,
        schemas: null,
        fetchingDatasets: false,
        userCanUpload: false
    }
};

const namespaced = true;

export const adrGetters = {
    errors: (state: ADRState) => {
        return [state.adrError, state.keyError]
    }
};

export const adr: Module<ADRState, RootState> = {
    namespaced,
    state: {...initialADRState()},
    actions,
    getters: adrGetters,
    mutations
};
