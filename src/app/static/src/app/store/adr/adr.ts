import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";
import {ADRSchemas} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {DataExplorationState} from "../dataExploration/dataExploration";

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

export const adr: Module<ADRState, DataExplorationState> = {
    namespaced,
    state: {...initialADRState()},
    actions,
    mutations
};
