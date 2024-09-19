import {Module} from "vuex";
import {Error} from "../../generated";
import {ADRSchemas} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {RootState} from "../../root";

export enum AdrDatasetType {
    Input = "input",
    Output = "output"
}

export interface ADRDatasetState {
    datasets: any[],
    releases: any[],
    fetchingDatasets: boolean,
    fetchingError: Error | null,
}

export interface ADRState {
    adrData: {
        [key in AdrDatasetType]: ADRDatasetState
    },
    key: string | null,
    keyError: Error | null,
    schemas: ADRSchemas | null,
    userCanUpload: boolean
    ssoLogin: boolean
}

export const initialADRState = (): ADRState => {
    return {
        adrData: {
            input: {
                datasets: [],
                releases: [],
                fetchingDatasets: false,
                fetchingError: null
            },
            output: {
                datasets: [],
                releases: [],
                fetchingDatasets: false,
                fetchingError: null
            }
        },
        key: null,
        keyError: null,
        schemas: null,
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
