import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";
import {ADRSchemas, Dict, UploadFile} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";

export interface ADRState {
    datasets: any[],
    fetchingDatasets: boolean,
    key: string | null,
    keyError: Error | null,
    adrError: Error | null,
    schemas: ADRSchemas | null,
    userCanUpload: boolean,
    uploadFiles: Dict<UploadFile> | null,
    uploadStatus: string | null
    uploadError: Error | null
    uploadSucceeded: boolean
}

export const initialADRState = (): ADRState => {
    return {
        datasets: [],
        key: null,
        keyError: null,
        adrError: null,
        schemas: null,
        fetchingDatasets: false,
        userCanUpload: false,
        uploadFiles: null,
        uploadStatus: null,
        uploadError: null,
        uploadSucceeded: false
    }
};

const namespaced = true;

export const adr: Module<ADRState, RootState> = {
    namespaced,
    state: {...initialADRState()},
    actions,
    mutations
};
