import {Module} from "vuex";
import {Error} from "../../generated";
import {ADRSchemas} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {RootState} from "../../root";

export interface ADRState {
    datasets: any[],
    releases: any[],
    fetchingDatasets: boolean,
    key: string | null,
    keyError: Error | null,
    adrError: Error | null,
    schemas: ADRSchemas | null,
    userCanUpload: boolean
    ssoLogin: boolean
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
        userCanUpload: false,
        ssoLogin: false
    }
};

const namespaced = true;

export const adr: Module<ADRState, RootState> = {
    namespaced,
    state: {...initialADRState()},
    actions,
    mutations
};
