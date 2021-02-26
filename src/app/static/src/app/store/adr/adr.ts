import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";
import {ADRSchemas} from "../../types";

export interface ADRState {
    datasets: any[],
    fetchingDatasets: boolean,
    key: string | null,
    keyError: Error | null,
    schemas: ADRSchemas | null,
}

export const initialADRState = (): ADRState => {
    return {
        datasets: [],
        key: null,
        keyError: null,
        schemas: null,
        fetchingDatasets: false,
    }
};

const namespaced = true;

export const adr: Module<ADRState, RootState> = {
    namespaced,
    state: {...initialADRState()},
   // actions, //TODO: ADd these!
    //mutations
};
